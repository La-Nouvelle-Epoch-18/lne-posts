-- Table: posts.comments

-- DROP TABLE posts.comments;

CREATE TABLE posts.comments
(
    comment_id serial,
    post integer NOT NULL,
    author integer NOT NULL,
    content text COLLATE pg_catalog."default" NOT NULL,
    ts timestamp(0) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT comments_pkey PRIMARY KEY (comment_id),
    CONSTRAINT "fk-comments-posts" FOREIGN KEY (post)
        REFERENCES posts.posts (post_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
        NOT VALID
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE posts.comments
    OWNER to lne_user;

GRANT ALL ON TABLE posts.comments TO lne_user;