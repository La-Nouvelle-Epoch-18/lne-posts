CREATE OR REPLACE FUNCTION posts.tr_f_update_vote() RETURNS trigger AS $emp_stamp$
    BEGIN
        IF TG_OP = 'INSERT' THEN
			IF NEW.negative THEN
				UPDATE posts.posts SET downvotes = downvotes+1 WHERE post_id = NEW.post;
			ELSE
				UPDATE posts.posts SET upvotes = upvotes-1 WHERE post_id = NEW.post;
			END IF;
        ELSIF TG_OP = 'DELETE' THEN
			IF OLD.negative THEN
				UPDATE posts.posts SET downvotes = downvotes-1 WHERE post_id = OLD.post;
			ELSE
				UPDATE posts.posts SET upvotes = upvotes-1 WHERE post_id = OLD.post;
			END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.negative != NEW.negative THEN
                IF OLD.negative THEN
					UPDATE posts.posts SET downvotes = downvotes-1, upvotes = upvotes+1 WHERE post_id = OLD.post;
				ELSE
					UPDATE posts.posts SET downvotes = downvotes+1, upvotes = upvotes-1 WHERE post_id = OLD.post;
				END IF;
            END IF;
        END IF;
        RETURN NEW;
    END;
$emp_stamp$ LANGUAGE plpgsql;

ALTER FUNCTION posts.tr_f_update_vote() OWNER TO lne_user;

DROP TRIGGER IF EXISTS tr_update_vote ON posts.posts_votes;

CREATE TRIGGER tr_update_vote AFTER INSERT OR UPDATE OF negative OR DELETE ON posts.posts_votes
    FOR EACH ROW EXECUTE PROCEDURE posts.tr_f_update_vote();
