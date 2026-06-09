// 글 HTTP 계층 (I/O만)
// 비즈니스 로직은 postService에. 컨트롤러는 req 읽고 서비스 호출 후 { success, data } 봉투만 만듦

const postService = require('../services/postService');

// POST /api/issues/:issueId/posts (auth)
// → 201 { id, issue_id, title, created_at } (FE는 /posts/:id로 리다이렉트)
async function create(req, res, next) {
  try {
    const post = await postService.create(req.params.issueId, req.user.sub, {
      title: req.body.title,
      content: req.body.content,
    });
    res.status(201).json({
      success: true,
      data: {
        id: post.id,
        issue_id: post.issue_id,
        title: post.title,
        created_at: post.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/:id (공개, optionalAuth) → { post, comments }
// getDetail이 합쳐진 전체 페이로드(post + user_vote + comments) 반환
async function getById(req, res, next) {
  try {
    const data = await postService.getDetail(req.params.id, req.user?.sub);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// PUT /api/posts/:id (auth, 작성자만) → 200 { id, title, updated_at }
async function update(req, res, next) {
  try {
    const post = await postService.update(req.params.id, req.user, {
      title: req.body.title,
      content: req.body.content,
    });
    res.json({
      success: true,
      data: { id: post.id, title: post.title, updated_at: post.updated_at },
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id (auth, 작성자 또는 어드민) → 204
async function remove(req, res, next) {
  try {
    await postService.remove(req.params.id, req.user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getById, update, remove };
