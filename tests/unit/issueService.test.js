// issueService 로직 — repo/gemini/time 모킹 (DB 없음)
// getHome, generateDailyIssue, getIssueDetail, 어드민 검수(list/publish/reject) 분기 커버

jest.mock('../../src/repositories/issueRepo');
jest.mock('../../src/jobs/geminiClient');
jest.mock('../../src/utils/time');

const issueRepo = require('../../src/repositories/issueRepo');
const geminiClient = require('../../src/jobs/geminiClient');
const { todayInKST } = require('../../src/utils/time');
const issueService = require('../../src/services/issueService');

beforeEach(() => {
  jest.clearAllMocks();
  todayInKST.mockReturnValue('2026-06-09');
});

describe('issueService.getHome', () => {
  test('오늘 이슈 + 지난 이슈 반환, past는 source_url 빠짐', async () => {
    issueRepo.findTodayPublished.mockResolvedValue({ id: 1, title: '오늘', source_url: 'http://x' });
    issueRepo.findPastPublished.mockResolvedValue([
      { id: 2, title: '어제', summary: 's', date: '2026-06-08', post_count: 3, created_at: 'c', source_url: 'http://y' },
    ]);
    const r = await issueService.getHome();
    expect(r.today_issue).toEqual({ id: 1, title: '오늘', source_url: 'http://x' });
    expect(r.past_issues[0]).not.toHaveProperty('source_url');
    expect(r.past_issues[0]).toMatchObject({ id: 2, post_count: 3 });
  });

  test('오늘 이슈 없으면 today_issue는 null', async () => {
    issueRepo.findTodayPublished.mockResolvedValue(null);
    issueRepo.findPastPublished.mockResolvedValue([]);
    const r = await issueService.getHome();
    expect(r.today_issue).toBeNull();
    expect(r.past_issues).toEqual([]);
  });
});

describe('issueService.generateDailyIssue', () => {
  test('오늘 이슈 이미 있으면 skipped (gemini 호출 안 함)', async () => {
    issueRepo.findByDate.mockResolvedValue({ id: 50 });
    const r = await issueService.generateDailyIssue(false);
    expect(r).toEqual({ date: '2026-06-09', status: 'skipped', issue_id: 50 });
    expect(geminiClient.generateIssue).not.toHaveBeenCalled();
  });

  test('없으면 gemini 생성 후 insert → success', async () => {
    issueRepo.findByDate.mockResolvedValue(null);
    geminiClient.generateIssue.mockResolvedValue({ title: 't', summary: 's', source_url: 'u' });
    issueRepo.insert.mockResolvedValue({ id: 77 });
    const r = await issueService.generateDailyIssue(false);
    expect(r).toEqual({ date: '2026-06-09', status: 'success', issue_id: 77 });
  });

  test('force면 중복 체크 건너뛰고 무조건 생성', async () => {
    geminiClient.generateIssue.mockResolvedValue({ title: 't', summary: 's', source_url: 'u' });
    issueRepo.insert.mockResolvedValue({ id: 88 });
    const r = await issueService.generateDailyIssue(true);
    expect(issueRepo.findByDate).not.toHaveBeenCalled();
    expect(r.status).toBe('success');
  });
});

describe('issueService.getIssueDetail', () => {
  test('없으면 404 ISSUE_NOT_FOUND', async () => {
    issueRepo.findPublishedById.mockResolvedValue(null);
    await expect(issueService.getIssueDetail(999, 'top')).rejects.toMatchObject({
      status: 404, code: 'ISSUE_NOT_FOUND',
    });
  });

  test('이슈 + 글 목록 반환', async () => {
    issueRepo.findPublishedById.mockResolvedValue({ id: 1, title: 't' });
    issueRepo.listPostsByIssue.mockResolvedValue([{ id: 9 }]);
    const r = await issueService.getIssueDetail(1, 'latest');
    expect(issueRepo.listPostsByIssue).toHaveBeenCalledWith(1, 'latest');
    expect(r).toEqual({ issue: { id: 1, title: 't' }, posts: [{ id: 9 }] });
  });

  test('이상한 sort는 top으로 보정', async () => {
    issueRepo.findPublishedById.mockResolvedValue({ id: 1 });
    issueRepo.listPostsByIssue.mockResolvedValue([]);
    await issueService.getIssueDetail(1, 'hacky');
    expect(issueRepo.listPostsByIssue).toHaveBeenCalledWith(1, 'top');
  });
});

describe('issueService.publishIssue', () => {
  test('성공 시 갱신 row 반환', async () => {
    issueRepo.publish.mockResolvedValue({ id: 1, status: 'published' });
    const r = await issueService.publishIssue(1);
    expect(r).toEqual({ id: 1, status: 'published' });
  });

  test('없으면 404', async () => {
    issueRepo.publish.mockResolvedValue(null);
    issueRepo.findById.mockResolvedValue(null);
    await expect(issueService.publishIssue(1)).rejects.toMatchObject({ status: 404, code: 'ISSUE_NOT_FOUND' });
  });

  test('이미 published면 409 ALREADY_PUBLISHED', async () => {
    issueRepo.publish.mockResolvedValue(null);
    issueRepo.findById.mockResolvedValue({ id: 1, status: 'published' });
    await expect(issueService.publishIssue(1)).rejects.toMatchObject({ status: 409, code: 'ALREADY_PUBLISHED' });
  });
});

describe('issueService.rejectIssue', () => {
  test('삭제 성공 시 통과', async () => {
    issueRepo.remove.mockResolvedValue(true);
    await expect(issueService.rejectIssue(1)).resolves.toBeUndefined();
  });

  test('없으면 404', async () => {
    issueRepo.remove.mockResolvedValue(false);
    issueRepo.findById.mockResolvedValue(null);
    await expect(issueService.rejectIssue(1)).rejects.toMatchObject({ status: 404, code: 'ISSUE_NOT_FOUND' });
  });

  test('pending 아니면 409 NOT_PENDING', async () => {
    issueRepo.remove.mockResolvedValue(false);
    issueRepo.findById.mockResolvedValue({ id: 1, status: 'published' });
    await expect(issueService.rejectIssue(1)).rejects.toMatchObject({ status: 409, code: 'NOT_PENDING' });
  });
});

describe('issueService.listForAdmin', () => {
  test('상태 그대로 repo에 전달', async () => {
    issueRepo.listByStatus.mockResolvedValue([{ id: 1 }]);
    const r = await issueService.listForAdmin('published');
    expect(issueRepo.listByStatus).toHaveBeenCalledWith('published');
    expect(r).toEqual([{ id: 1 }]);
  });
});
