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
router.put('/:post_id/vote', authenticated, voteForPost);
router.put('/comment/:comment_id', authenticated, editPostComment);
router.delete('/:post_id', authenticated, deletePost);
router.delete('/comment/:comment_id', authenticated, deleteComment);

export const MainRouter: Router = router;

/* ------------------------------- *
 *  Functions
 * ------------------------------- */

 /**
 * @api {get} / Get all posts
 * @apiDescription Return all posts
 * @apiName GetPosts
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiParam (QueryParameters) {String{ts,upvotes,downvotes}} [sort] Property used to sort the data.
 * @apiParam (QueryParameters) {String{asc,desc}} [order] Order in which to sort the data.
 * @apiParam (QueryParameters) {Integer{0+}} [page] Page index to get.
 * @apiParam (QueryParameters) {Integer{1+}} [items] Number of element per page.
 *
 * @apiSuccess (Success) {Object[]} data Array of objects containing data.
 * @apiSuccess (Success) {Integer{1+}} data.post_id Identifier of the post.
 * @apiSuccess (Success) {Integer{1+}} data.author Identifier of the author.
 * @apiSuccess (Success) {String} data.title Title of the post.
 * @apiSuccess (Success) {String} data.content Content of the post.
 * @apiSuccess (Success) {String{DateTimeISO}} data.ts The date and time of the post.
 * @apiSuccess (Success) {Integer{0+}} data.upvotes Number of upvotes.
 * @apiSuccess (Success) {Integer{0+}} data.downvotes Number of downvotes.
 * @apiSuccess (Success) {String{DateTimeISO}} data.expiration Expiration date and time of the post.
 */
 /**
 * @api {get} /temporary Get temporary posts
 * @apiDescription Return all temporary posts
 * @apiName GetTemporaryPosts
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiParam (QueryParameters) {String{ts,upvotes,downvotes}} [sort] Property used to sort the data.
 * @apiParam (QueryParameters) {String{asc,desc}} [order] Order in which to sort the data.
 * @apiParam (QueryParameters) {Integer{0+}} [page] Page index to get.
 * @apiParam (QueryParameters) {Integer{1+}} [items] Number of element per page.
 *
 * @apiSuccess (Success) {Object[]} data Array of objects containing data.
 * @apiSuccess (Success) {Integer{1+}} data.post_id Identifier of the post.
 * @apiSuccess (Success) {Integer{1+}} data.author Identifier of the author.
 * @apiSuccess (Success) {String} data.title Title of the post.
 * @apiSuccess (Success) {String} data.content Content of the post.
 * @apiSuccess (Success) {String{DateTimeISO}} data.ts The date and time of the post.
 * @apiSuccess (Success) {Integer{0+}} data.upvotes Number of upvotes.
 * @apiSuccess (Success) {Integer{0+}} data.downvotes Number of downvotes.
 * @apiSuccess (Success) {String{DateTimeISO}} data.expiration Expiration date and time of the post.
 */
 /**
 * @api {get} /permanent Get permanent posts
 * @apiDescription Return all permanent posts
 * @apiName GetPermanentPosts
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiParam (QueryParameters) {String{ts,upvotes,downvotes}} [sort] Property used to sort the data.
 * @apiParam (QueryParameters) {String{asc,desc}} [order] Order in which to sort the data.
 * @apiParam (QueryParameters) {Integer{0+}} [page] Page index to get.
 * @apiParam (QueryParameters) {Integer{1+}} [items] Number of element per page.
 *
 * @apiSuccess (Success) {Object[]} data Array of objects containing data.
 * @apiSuccess (Success) {Integer{1+}} data.post_id Identifier of the post.
 * @apiSuccess (Success) {Integer{1+}} data.author Identifier of the author.
 * @apiSuccess (Success) {String} data.title Title of the post.
 * @apiSuccess (Success) {String} data.content Content of the post. Max 80 chars.
 * @apiSuccess (Success) {String{DateTimeISO}} data.ts The date and time of the post.
 * @apiSuccess (Success) {Integer{0+}} data.upvotes Number of upvotes.
 * @apiSuccess (Success) {Integer{0+}} data.downvotes Number of downvotes.
 * @apiSuccess (Success) {Null} data.expiration Expiration date and time of the post.
 */
function getPosts(type: 'all' | 'permanent' | 'temporary')
{
    return async (req: Request, res: Response) =>
    {
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
                SELECT post_id, author, title, SUBSTRING(content, 1, 80) AS content, ts, upvotes, downvotes, expiration
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

 /**
 * @api {get} /:id Get a post
 * @apiDescription Return a post
 * @apiName GetPost
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiParam (UrlParameters) {Integer{1+}} id The post identifier.
 *
 * @apiSuccess (Success) {Object[]} data Array of objects containing data.
 * @apiSuccess (Success) {Integer{1+}} data.post_id Identifier of the post.
 * @apiSuccess (Success) {Integer{1+}} data.author Identifier of the author.
 * @apiSuccess (Success) {String} data.title Title of the post.
 * @apiSuccess (Success) {String} data.content Content of the post.
 * @apiSuccess (Success) {String{DateTimeISO}} data.ts The date and time of the post.
 * @apiSuccess (Success) {Integer{0+}} data.upvotes Number of upvotes.
 * @apiSuccess (Success) {Integer{0+}} data.downvotes Number of downvotes.
 * @apiSuccess (Success) {String/Null{DateTimeISO}} data.expiration Expiration date and time of the post.
 */
async function getPost(req: Request, res: Response)
{
    if (!new QueryValidator().id('post_id', true).check(req.params, res)) return;

    const postId = parseInt(req.params.post_id);

    try
    {
        const results = await query(`
            SELECT post_id, author, title, content, ts, upvotes, downvotes, expiration
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

 /**
 * @api {post} / Create a post
 * @apiDescription Create a post
 * @apiName PostPost
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiPermission Authenticated
 * 
 * @apiParam (BodyParameters) {String{255}} title Title of the post.
 * @apiParam (BodyParameters) {String} content Content of the post.
 * @apiParam (BodyParameters) {String{DateTimeISO}} [expiration] Expiration date of the post.
 *
 * @apiSuccess (Success) {Object[]} data Object containing data.
 * @apiSuccess (Success) {Integer{1+}} data.post_id Identifier of the post.
 */
async function createPost(req: Request, res: Response)
{
    if (!new BodyValidator().str('title', true, 255).str('content', true).date('expiration', false, false, true, true, false).check(req.body, res)) return;

    try
    {
        const results = await query(`
            INSERT INTO posts.posts (author, title, content, expiration) VALUES ($1, $2, $3, $4) RETURNING post_id`,
            [req.decoded.id, req.body.title, req.body.content, req.body.expiration]);

        res.status(200).json({
            data: results.rows[0]
        });
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

 /**
 * @api {put} /:id Edit a post
 * @apiDescription Edit a post
 * @apiName PutPost
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiPermission Authenticated
 * 
 * @apiParam (UrlParameters) {Integer{1+}} id Identifier of the post.
 * 
 * @apiParam (BodyParameters) {String{255}} [title] Title of the post.
 * @apiParam (BodyParameters) {String} [content] Content of the post.
 */
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

        if (checkResult.rows[0].author !== req.decoded.id)
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

        res.status(204).end();;
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

 /**
 * @api {delete} /:id Delete a post
 * @apiDescription Delete a post
 * @apiName DeletePost
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiPermission Authenticated
 * 
 * @apiParam (UrlParameters) {Integer{1+}} id Identifier of the post.
 */
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

        if (checkResult.rows[0].author !== req.decoded.id)
        {
            res.status(403).json({
                error: "Cannot edit this post"
            });
            return;
        }
        await query(`DELETE FROM posts.posts WHERE post_id = $1`, [postId]);

        res.status(204).end();
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

 /**
 * @api {get} /:id/comments Get a post's comments
 * @apiDescription Return all comments of a post
 * @apiName GetComments
 * @apiGroup Comments
 * @apiVersion 1.0.0
 *
 * @apiParam (UrlParameters) {Integer{1+}} id Identifier of the post.
 * 
 * @apiParam (QueryParameters) {Integer{0+}} [page] Page index to get.
 * @apiParam (QueryParameters) {Integer{1+}} [items] Number of element per page.
 *
 * @apiSuccess (Success) {Object[]} data Array of objects containing data.
 * @apiSuccess (Success) {Integer{1+}} data.comment_id Identifier of the comment.
 * @apiSuccess (Success) {Integer{1+}} data.post Identifier of the post.
 * @apiSuccess (Success) {Integer{1+}} data.author Identifier of the author.
 * @apiSuccess (Success) {String} data.content Content of the post.
 * @apiSuccess (Success) {String{DateTimeISO}} data.ts The date and time of the post.
 */
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

 /**
 * @api {get} /comment/:id Get a comment
 * @apiDescription Return a comment
 * @apiName GetComment
 * @apiGroup Comments
 * @apiVersion 1.0.0
 *
 * @apiParam (UrlParameters) {Integer{1+}} id Identifier of the comment.
 * 
 * @apiSuccess (Success) {Object} data Object containing data.
 * @apiSuccess (Success) {Integer{1+}} data.comment_id Identifier of the comment.
 * @apiSuccess (Success) {Integer{1+}} data.post Identifier of the post.
 * @apiSuccess (Success) {Integer{1+}} data.author Identifier of the author.
 * @apiSuccess (Success) {String} data.content Content of the post.
 * @apiSuccess (Success) {String{DateTimeISO}} data.ts The date and time of the post.
 */
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

 /**
 * @api {post} /:id/comment Create a comment
 * @apiDescription Create a comment
 * @apiName PostComment
 * @apiGroup Comments
 * @apiVersion 1.0.0
 *
 * @apiPermission Authenticated
 * 
 * @apiParam (UrlParameters) {Integer{1+}} id Identifier of the post.
 * 
 * @apiParam (BodyParameters) {String} content Content of the comment.
 *
 * @apiSuccess (Success) {Object[]} data Object containing data.
 * @apiSuccess (Success) {Integer{1+}} data.comment_id Identifier of the comment.
 */
async function createPostComment(req: Request, res: Response)
{
    if (!new QueryValidator().id('post_id', true).check(req.params, res)) return;
    if (!new BodyValidator().str('content', true).check(req.body, res)) return;

    const postId = parseInt(req.params.post_id, 10);

    try
    {
        const results = await query(`
            INSERT INTO posts.comments (author, post, content) VALUES ($1, $2, $3) RETURNING comment_id`,
            [req.decoded.id, postId, req.body.content]);

        res.status(200).json({
            data: results.rows[0]
        });
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

/**
 * @api {put} /comment/:id Edit a comment
 * @apiDescription Edit a post
 * @apiName PutComment
 * @apiGroup Comments
 * @apiVersion 1.0.0
 *
 * @apiPermission Authenticated
 * 
 * @apiParam (UrlParameters) {Integer{1+}} id Identifier of the comment.
 * 
 * @apiParam (BodyParameters) {String} content Content of the comment.
 */
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

        if (checkResult.rows[0].author !== req.decoded.id)
        {
            res.status(403).json({
                error: "Cannot delete this Comment"
            });
            return;
        }

        await query(`UPDATE posts.comments SET content = $2 WHERE comment_id = $1`,
            [commentId, req.body.content]);

        res.status(204).end();
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

 /**
 * @api {delete} /comment/:id Delete a comment
 * @apiDescription Delete a comment
 * @apiName DeleteComment
 * @apiGroup Comments
 * @apiVersion 1.0.0
 *
 * @apiPermission Authenticated
 * 
 * @apiParam (UrlParameters) {Integer{1+}} id Identifier of the comment.
 */
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

        if (checkResult.rows[0].author !== req.decoded.id)
        {
            res.status(403).json({
                error: "Cannot delete this comment"
            });
            return;
        }
        await query(`DELETE FROM posts.comments WHERE comment_id = $1`, [commentId]);

        res.status(204).end();
    }
    catch (err)
    {
        databaseError(res, err);
    }
}

/**
 * @api {put} /:id/vote Vote for a post
 * @apiDescription Vote for a post
 * @apiName PutPostVote
 * @apiGroup Posts
 * @apiVersion 1.0.0
 *
 * @apiPermission Authenticated
 * 
 * @apiParam (UrlParameters) {Integer{1+}} id Identifier of the post.
 * 
 * @apiParam (BodyParameters) {Boolean} [negative] True when the vote is a downvote, false otherwise.
 */
async function voteForPost(req: Request, res: Response)
{
    if (!new QueryValidator().id('post_id', true).check(req.params, res)) return;
    if (!new BodyValidator().boolean('negative', false).check(req.body, res)) return;

    const postId = parseInt(req.params.post_id, 10);
    const negative = req.body.negative === undefined ? false : req.body.negative;

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

        await query(`
            INSERT INTO posts.posts_votes (post, author, negative) VALUES ($1, $2, $3)
            ON CONFLICT ON CONSTRAINT posts_votes_pkey DO UPDATE SET negative=$3`, [postId, req.decoded.id, negative]);
        res.status(204).end();
    }
    catch (err)
    {
        databaseError(res, err);
    }
}
