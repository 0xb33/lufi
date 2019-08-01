-- 1 up
CREATE TABLE IF NOT EXISTS files (
    short                varchar(255) PRIMARY KEY,
    deleted              boolean default false,
    mediatype            varchar(255),
    filename             varchar(255),
    filesize             integer,
    counter              integer default 0,
    delete_at_first_view boolean,
    delete_at_day        integer,
    created_at           integer,
    created_by           varchar(255),
    last_access_at       integer,
    mod_token            varchar(255),
    nbslices             integer,
    complete             boolean default false,
    passwd               varchar(255),
    abuse                integer
);

CREATE TABLE IF NOT EXISTS slices (
    short varchar(255)        NOT NULL REFERENCES files(short) ON DELETE CASCADE,
    j     integer             NOT NULL,
    path  varchar(255) unique NOT NULL,
    constraint slice_short_j UNIQUE (short, j)
);
-- 1 down
DROP TABLE slices;
DROP TABLE files;
-- 2 up
ALTER TABLE files ADD COLUMN zipped boolean default false;
-- 2 down
ALTER TABLE files DROP COLUMN zipped;
