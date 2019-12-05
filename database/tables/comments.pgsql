CREATE TABLE posts.comments
(
    comment_id serial NOT NULL,
    post integer NOT NULL,
    author integer NOT NULL,
    content text NOT NULL,
    ts timestamp(0) with time zone NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (comment_id),
    CONSTRAINT "fk-comments-posts" FOREIGN KEY (post)
        REFERENCES posts.posts (post_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)
WITH (
    OIDS = FALSE
);

ALTER TABLE posts.comments
    OWNER to lne_user;

ALTER TABLE posts.comments DROP CONSTRAINT "fk-comments-posts";

ALTER TABLE posts.comments
    ADD CONSTRAINT "fk-comments-posts" FOREIGN KEY (post)
    REFERENCES posts.posts (post_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
    NOT VALID;