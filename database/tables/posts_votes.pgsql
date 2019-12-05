CREATE TABLE posts.posts_votes
(
    post integer NOT NULL,
    author integer NOT NULL,
    negative boolean NOT NULL,
    PRIMARY KEY (post, author),
    CONSTRAINT "fk-posts_votes-posts" FOREIGN KEY (post)
        REFERENCES posts.posts (post_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)
WITH (
    OIDS = FALSE
);

ALTER TABLE posts.posts_votes
    OWNER to lne_user;