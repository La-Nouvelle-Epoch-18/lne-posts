CREATE TABLE posts.posts
(
    post_id serial NOT NULL,
    author integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    ts timestamp(0) with time zone NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (post_id)
)
WITH (
    OIDS = FALSE
);

ALTER TABLE posts.posts
    OWNER to lne_user;

GRANT ALL ON TABLE posts.posts TO lne_user;


ALTER TABLE posts.posts
    ADD COLUMN votes integer NOT NULL DEFAULT 0;

ALTER TABLE posts.posts
    RENAME votes TO upvotes;

ALTER TABLE posts.posts
    ADD COLUMN downvotes integer NOT NULL DEFAULT 0;