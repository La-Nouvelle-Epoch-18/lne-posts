import express = require('express');

import { Request, Response } from 'express';
import { Router } from 'express-serve-static-core';

import { query } from '../db';
import { databaseError } from '../util';
import { authenticated } from '../middlewares';
import { QueryValidator, BodyValidator } from '../validator';

/* ------------------------------- *
 *  Router
 * ------------------------------- */
const router = express.Router();

router.get('/', getPosts('all'));
router.get('/temporary', getPosts('temporary'));
router.get('/permanent', getPosts('permanent'));
router.get('/comment/:comment_id', getComment);
router.get('/:post_id', getPost);
router.get('/:post_id/comments', getPostComments);
router.post('/', authenticated, createPost);
router.post('/:post_id/comment', authenticated, createPostComment);
router.put('/:post_id', authenticated, editPost);
router.put('/comment/:comment_id', authenticated, editPostComment);
router.delete('/:post_id', authenticated, deletePost);
router.delete('/comment/:comment_id', authenticated, deleteComment);

export const MainRouter: Router = router;

/* ------------------------------- *
 *  Functions
 * ------------------------------- */

function getPosts(type: 'all'|'permanent'|'temporary')
{
    return async (req: Request, res: Response) => {
        if (!new QueryValidator()
            .inclusion('sort', false, ['ts', 'upvotes', 'downvotes'])
            .inclusion('order', false, ['asc', 'desc'])
            .number('page', false, 0)
            .number('items', false, 1)
            .check(req.query, res)) return;

        const sort = req.query.sort || 'ts';
        const order = req.query.order || 'desc';
        const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 0;
        const items = req.query.items !== undefined ? parseInt(req.query.items, 10) : 20;

        try
        {
            const results = await query(`
                SELECT post_id, author, title, SUBSTRING(content, 1, 80) AS content, ts, upvotes, downvotes
                FROM posts.posts
                ${type == 'permanent' ? 'WHERE expiration IS NULL' : type == 'temporary' ? 'WHERE expiration IS NOT NULL' : ''}
                ORDER BY ${sort} ${order}
                LIMIT $1
                OFFSET $2`,
                [items, page]);

            res.status(200).json({
                data: results.rows
            });
        }
        catch (err)
        {
            databaseError(res, err);
        }
    }
}

async function getPost(req: Request, res: Response)
{
    if (!new QueryValidator().id('post_id', true).check(req.params, res)) return;

    const postId = parseInt(req.params.post_id);

    try
    {
        const results = await query(`
            SELECT post_id, author, title, content, ts, upvotes, downvotes
            FROM posts.posts
            WHERE post_id = $1`,
            [postId]);

        res.status(200).json({
            data: results.rows[0]
        });
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

async function createPost(req: Request, res: Response)
{
    if (!new BodyValidator().str('title', true, 255).str('content', true).date('expiration', false, false, true, true, false).check(req.body, res)) return;

    try
    {
        // TODO: author_id
        const results = await query(`
            INSERT INTO posts.posts (author, title, content, expiration) VALUES ($1, $2, $3, $4) RETURNING post_id`,
            [1, req.body.title, req.body.content, req.body.expiration]);

        res.status(200).json({
            data: results.rows[0]
        });
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

async function editPost(req: Request, res: Response)
{
    if (!new QueryValidator().id('post_id', true).check(req.params, res)) return;
    if (!new BodyValidator().str('title', false, 255).str('content', false).check(req.body, res)) return;

    const postId = parseInt(req.params.post_id, 10);

    try
    {
        const checkResult = await query(`SELECT author FROM posts.posts WHERE post_id = $1`, [postId])

        if (checkResult.rowCount == 0)
        {
            res.status(404).json({
                error: "Post not found"
            });
            return;
        }

        if (checkResult.rows[0].author !== 1) // TODO: use authenticated user
        {
            res.status(403).json({
                error: "Cannot edit this post"
            });
            return;
        }

        if (req.body.content == undefined && req.body.title == undefined)
        {
            res.status(400).json({
                error: "Nothing to do"
            });
            return;
        }

        let counter = 2;

        const updateParts: string[] = [];
        const params: any[] = [postId];
        if (req.body.title !== undefined)
        {
            updateParts.push(`title = $${counter++}`);
            params.push(req.body.title);
        }
        if (req.body.content !== undefined)
        {
            updateParts.push(`content = $${counter++}`);
            params.push(req.body.content);
        }

        await query(`UPDATE posts.posts SET
            ${updateParts.join(',')}
            WHERE post_id = $1
        `, params);

        res.status(200).json({});
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

async function deletePost(req: Request, res: Response)
{
    if (!new QueryValidator().id('post_id', true).check(req.params, res)) return;

    const postId = parseInt(req.params.post_id, 10);

    try
    {
        const checkResult = await query(`SELECT author FROM posts.posts WHERE post_id = $1`, [postId])

        if (checkResult.rowCount == 0)
        {
            res.status(404).json({
                error: "Post not found"
            });
            return;
        }

        if (checkResult.rows[0].author !== 1) // TODO: use authenticated user
        {
            res.status(403).json({
                error: "Cannot edit this post"
            });
            return;
        }
        await query(`DELETE FROM posts.posts WHERE post_id = $1`, [postId]);

        res.status(200).json({});
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

async function getPostComments(req: Request, res: Response)
{
    if (!new QueryValidator().id('post_id', true).check(req.params, res)) return;
    if (!new QueryValidator()
        .number('page', false, 0)
        .number('items', false, 1)
        .check(req.query, res)) return;

    const postId = parseInt(req.params.post_id, 10);
    const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 0;
    const items = req.query.items !== undefined ? parseInt(req.query.items, 10) : 20;

    try
    {
        const results = await query(`
            SELECT comment_id, author, post, content, ts
            FROM posts.comments
            WHERE post = $1
            LIMIT $2
            OFFSET $3`,
            [postId, items, page]);

        res.status(200).json({
            data: results.rows
        });
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

async function getComment(req: Request, res: Response)
{
    if (!new QueryValidator().id('comment_id', true).check(req.params, res)) return;

    const commentId = parseInt(req.params.comment_id);

    try
    {
        const results = await query(`
            SELECT comment_id, author, post, content, ts
            FROM posts.comments
            WHERE comment_id = $1`,
            [commentId]);

        res.status(200).json({
            data: results.rows[0]
        });
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

async function createPostComment(req: Request, res: Response)
{
    if (!new QueryValidator().id('post_id', true).check(req.params, res)) return;
    if (!new BodyValidator().str('content', true).check(req.body, res)) return;

    const postId = parseInt(req.params.post_id, 10);

    try
    {
        // TODO: author_id
        const results = await query(`
            INSERT INTO posts.comments (author, post, content) VALUES ($1, $2, $3) RETURNING comment_id`,
            [1, postId, req.body.content]);

        res.status(200).json({
            data: results.rows[0]
        });
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

async function editPostComment(req: Request, res: Response)
{
    if (!new QueryValidator().id('comment_id', true).check(req.params, res)) return;
    if (!new BodyValidator().str('content', true).check(req.body, res)) return;

    const commentId = parseInt(req.params.comment_id, 10);

    try
    {
        const checkResult = await query(`SELECT author FROM posts.comments WHERE comment_id = $1`, [commentId])

        if (checkResult.rowCount == 0)
        {
            res.status(404).json({
                error: "Comment not found"
            });
            return;
        }

        if (checkResult.rows[0].author !== 1) // TODO: use authenticated user
        {
            res.status(403).json({
                error: "Cannot delete this Comment"
            });
            return;
        }

        await query(`UPDATE posts.comments SET content = $2 WHERE comment_id = $1`,
            [commentId, req.body.content]);

        res.status(200).json({});
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

async function deleteComment(req: Request, res: Response)
{
    if (!new QueryValidator().id('comment_id', true).check(req.params, res)) return;

    const commentId = parseInt(req.params.comment_id, 10);

    try
    {
        const checkResult = await query(`SELECT author FROM posts.comments WHERE comment_id = $1`, [commentId])

        if (checkResult.rowCount == 0)
        {
            res.status(404).json({
                error: "Comment not found"
            });
            return;
        }

        if (checkResult.rows[0].author !== 1) // TODO: use authenticated user
        {
            res.status(403).json({
                error: "Cannot delete this comment"
            });
            return;
        }
        await query(`DELETE FROM posts.comments WHERE comment_id = $1`, [commentId]);

        res.status(200).json({});
    }
    catch (err)
    {
        databaseError(res, err);
    }
}