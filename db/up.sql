--
-- PostgreSQL database dump
--

-- Dumped from database version 12.3
-- Dumped by pg_dump version 12.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: _final_median(numeric[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public._final_median(numeric[]) RETURNS numeric
    LANGUAGE sql IMMUTABLE
    AS $_$
   SELECT AVG(val)
   FROM (
     SELECT val
     FROM unnest($1) val
     ORDER BY 1
     LIMIT  2 - MOD(array_upper($1, 1), 2)
     OFFSET CEIL(array_upper($1, 1) / 2.0) - 1
   ) sub;
$_$;


ALTER FUNCTION public._final_median(numeric[]) OWNER TO postgres;

--
-- Name: diesel_manage_updated_at(regclass); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.diesel_manage_updated_at(_tbl regclass) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s
                    FOR EACH ROW EXECUTE PROCEDURE diesel_set_updated_at()', _tbl);
END;
$$;


ALTER FUNCTION public.diesel_manage_updated_at(_tbl regclass) OWNER TO postgres;

--
-- Name: diesel_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.diesel_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (
        NEW IS DISTINCT FROM OLD AND
        NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at
    ) THEN
        NEW.updated_at := current_timestamp;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.diesel_set_updated_at() OWNER TO postgres;

--
-- Name: do_user_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.do_user_update() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE users SET game_turns = game_turns+1, turns = turns+1, streak = streak+1 WHERE id in (SELECT user_id FROM past_turns WHERE day = 1 AND season = 1);
    UPDATE users SET streak = 0 WHERE id NOT IN (SELECT user_id FROM past_turns WHERE day = 1 AND season = 1);
    UPDATE users SET mvps = mvps.mvps FROM (SELECT user_id, SUM(case when mvp=true THEN 1 ELSE 0 END) as mvps FROM past_turns GROUP BY user_id) as mvps WHERE mvps.user_id = users.id;
    UPDATE users SET overall = overall.overall FROM (SELECT id, 
        _final_median(array[
            (case 
            when mvps >= 25 then 5
            when mvps >=10 then 4
            when mvps>=5 THEN 3
            when mvps >= 1 THEN 2
            when mvps = 0 THEN 1
            else 0 end),
            (case 
            when turns >= 100 then 5 
            when turns >= 50 then 4 
            when turns >= 25 then 3 
            when turns >= 10 then 2 
            when turns >= 0 then 1 
            else 0 end),
            (case
            when game_turns >= 40 then 5
            when game_turns >= 25 then 4
            when game_turns >= 10 then 3
            when game_turns >= 5 then 2
            when game_turns >= 0 then 1
            else 0 end),
            (case
            when awards >= 4 then 5
            when awards >= 3 then 4
            when awards >= 2 then 3
            when awards >= 1 then 2
            when awards >= 0 then 1
            else 0 end),
            (case
            when streak >= 25 then 5
            when streak >= 10 then 4
            when streak >= 5 then 3
            when streak >= 3 then 2
            when streak >= 0 then 1
            else 0 end)
            ]) as overall FROM users GROUP BY id) as overall where overall.id= users.id;
    return FOUND;
    END;
    $$;


ALTER FUNCTION public.do_user_update() OWNER TO postgres;

--
-- Name: do_user_update(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.do_user_update(day integer, season integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE users SET streak = streak+1 WHERE id in (SELECT user_id FROM past_turns WHERE past_turns.day = do_user_update.day AND past_turns.season = do_user_update.season);
    UPDATE users SET streak = 0 WHERE id NOT IN (SELECT user_id FROM past_turns WHERE past_turns.day = do_user_update.day AND past_turns.season = do_user_update.season);
    UPDATE users SET mvps = mvps.mvps, turns = mvps.turns FROM (SELECT user_id, SUM(case when mvp=true THEN 1 ELSE 0 END) as mvps, count(*) as turns FROM past_turns GROUP BY user_id) as mvps WHERE mvps.user_id = users.id;
    UPDATE users SET game_turns = game_turns.game_turns FROM (SELECT user_id, count(*) as game_turns FROM past_turns WHERE past_turns.season = do_user_update.season GROUP BY user_id) as game_turns WHERE game_turns.user_id = users.id;
    UPDATE users SET overall = overall.overall FROM (SELECT id, 
        _final_median(array[
            (case 
            when mvps >= 25 then 5
            when mvps >=10 then 4
            when mvps>=5 THEN 3
            when mvps >= 1 THEN 2
            when mvps = 0 THEN 1
            else 0 end),
            (case 
            when turns >= 100 then 5 
            when turns >= 50 then 4 
            when turns >= 25 then 3 
            when turns >= 10 then 2 
            when turns >= 0 then 1 
            else 0 end),
            (case
            when game_turns >= 40 then 5
            when game_turns >= 25 then 4
            when game_turns >= 10 then 3
            when game_turns >= 5 then 2
            when game_turns >= 0 then 1
            else 0 end),
            (case
            when awards >= 4 then 5
            when awards >= 3 then 4
            when awards >= 2 then 3
            when awards >= 1 then 2
            when awards >= 0 then 1
            else 0 end),
            (case
            when streak >= 25 then 5
            when streak >= 10 then 4
            when streak >= 5 then 3
            when streak >= 3 then 2
            when streak >= 0 then 1
            else 0 end)
            ]) as overall FROM users GROUP BY id) as overall where overall.id= users.id;
    return FOUND;
    END;
    $$;


ALTER FUNCTION public.do_user_update(day integer, season integer) OWNER TO postgres;

--
-- Name: territorypower(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.territorypower(integer, integer, integer) RETURNS bigint
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$SELECT sum(power) FROM past_turns WHERE season = $1 AND day = $2 AND territory = $3 limit 1;$_$;


ALTER FUNCTION public.territorypower(integer, integer, integer) OWNER TO postgres;

--
-- Name: median(numeric); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE public.median(numeric) (
    SFUNC = array_append,
    STYPE = numeric[],
    INITCOND = '{}',
    FINALFUNC = public._final_median
);


ALTER AGGREGATE public.median(numeric) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __diesel_schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.__diesel_schema_migrations (
    version character varying(50) NOT NULL,
    run_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.__diesel_schema_migrations OWNER TO postgres;

--
-- Name: captchas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.captchas (
    id integer NOT NULL,
    title character varying(16),
    content public.citext
);


ALTER TABLE public.captchas OWNER TO postgres;

--
-- Name: captchas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.captchas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.captchas_id_seq OWNER TO postgres;

--
-- Name: captchas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.captchas_id_seq OWNED BY public.captchas.id;


--
-- Name: past_turns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.past_turns (
    id integer NOT NULL,
    user_id integer,
    season integer,
    day integer,
    territory integer,
    mvp boolean DEFAULT false NOT NULL,
    power double precision,
    multiplier double precision,
    weight integer,
    stars integer,
    team integer,
    alt_score integer,
    merc boolean DEFAULT false
);


ALTER TABLE public.past_turns OWNER TO postgres;

--
-- Name: territories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.territories (
    id integer NOT NULL,
    name text
);


ALTER TABLE public.territories OWNER TO postgres;

--
-- Name: heat; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.heat AS
 select territories.name, rd.season, rd.day, count(past_turns.territory) as cumulative_players, sum(past_turns.power) as cumulative_power from territories cross join (select season, day from turninfo where complete = true) rd left join past_turns on (rd.season = past_turns.season and rd.day = past_turns.day and territories.id = past_turns.territory) group by territories.name, rd.season, rd.day order by territories.name, rd.season desc, rd.day desc;


ALTER TABLE public.heat OWNER TO postgres;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    tname text,
    tshortname text,
    creation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    color_1 text,
    color_2 text,
    logo text
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: territory_ownership; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.territory_ownership (
    id integer NOT NULL,
    territory_id integer,
    territory_name text,
    owner_id integer,
    day integer,
    season integer,
    previous_owner_id integer,
    random_number double precision,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    mvp integer
);


ALTER TABLE public.territory_ownership OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    uname text NOT NULL,
    platform text NOT NULL,
    join_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    current_team integer DEFAULT 0 NOT NULL,
    auth_key text,
    overall integer DEFAULT 1,
    turns integer DEFAULT 0,
    game_turns integer DEFAULT 0,
    mvps integer DEFAULT 0,
    streak integer DEFAULT 0,
    awards integer DEFAULT 0,
    role_id integer DEFAULT 0,
    playing_for integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: territory_ownership_without_neighbors; Type: VIEW; Schema: public; Owner: postgres
--

 CREATE VIEW territory_ownership_without_neighbors as SELECT territory_ownership.territory_id,
    territory_ownership.day,
    territory_ownership.season,
    territories.name,
    teams.tname AS owner,
    tex.tname AS prev_owner,
    territory_ownership."timestamp",
    territory_ownership.random_number,
    users.uname AS mvp
   FROM ((((public.territory_ownership
     LEFT JOIN public.teams ON ((teams.id = territory_ownership.owner_id)))
     LEFT JOIN public.teams tex ON ((tex.id = territory_ownership.previous_owner_id)))
     LEFT JOIN public.territories ON ((territory_ownership.territory_id = territories.id)))
     LEFT JOIN public.users ON ((users.id = territory_ownership.mvp)))
       ORDER BY territory_ownership.season DESC, territory_ownership.day DESC;


ALTER TABLE public.territory_ownership_without_neighbors OWNER TO postgres;

--
-- Name: heat_full; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.heat_full AS
 SELECT heat.name,
    heat.season,
    heat.day,
    heat.cumulative_players,
    heat.cumulative_power,
    territory_ownership_without_neighbors.owner
   FROM (public.heat
     LEFT JOIN public.territory_ownership_without_neighbors ON (((territory_ownership_without_neighbors.name = heat.name) AND (territory_ownership_without_neighbors.day = heat.day) AND (territory_ownership_without_neighbors.season = heat.season))));


ALTER TABLE public.heat_full OWNER TO postgres;

--
-- Name: moves; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.moves AS
 SELECT past_turns.season,
    past_turns.day,
    past_turns.territory,
    foo.user_id,
    users.current_team AS team,
    past_turns.user_id AS player,
    past_turns.mvp,
    users.uname,
    users.turns,
    users.mvps,
    teams.tname,
    past_turns.power,
    past_turns.weight,
    past_turns.stars
   FROM (((( SELECT max(past_turns_1.id) AS id,
            past_turns_1.user_id
           FROM public.past_turns past_turns_1
          GROUP BY past_turns_1.user_id) foo
     JOIN public.past_turns ON ((past_turns.id = foo.id)))
     LEFT JOIN public.users ON ((foo.user_id = users.id)))
     LEFT JOIN public.teams ON ((users.current_team = teams.id)))
  ORDER BY users.uname;


ALTER TABLE public.moves OWNER TO postgres;

--
-- Name: new_turns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.new_turns (
    id integer NOT NULL,
    user_id integer,
    season integer,
    day integer,
    territory integer,
    mvp boolean DEFAULT false NOT NULL,
    power double precision,
    multiplier double precision,
    weight double precision,
    stars integer,
    team integer,
    alt_score integer,
    merc boolean DEFAULT false
);


ALTER TABLE public.new_turns OWNER TO postgres;

--
-- Name: new_turns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.new_turns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.new_turns_id_seq OWNER TO postgres;

--
-- Name: new_turns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.new_turns_id_seq OWNED BY public.new_turns.id;


--
-- Name: territory_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.territory_stats (
    team integer,
    season integer,
    day integer,
    ones integer,
    twos integer,
    threes integer,
    fours integer,
    fives integer,
    teampower double precision,
    chance double precision,
    id integer NOT NULL,
    territory integer,
    territory_power double precision
);


ALTER TABLE public.territory_stats OWNER TO postgres;

--
-- Name: odds; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.odds AS
 SELECT territory_stats.ones,
    territory_stats.twos,
    territory_stats.threes,
    territory_stats.fours,
    territory_stats.fives,
    ((((territory_stats.ones + territory_stats.twos) + territory_stats.threes) + territory_stats.fours) + territory_stats.fives) AS players,
    territory_stats.teampower,
    territory_stats.territory_power AS territorypower,
    territory_stats.chance,
    territory_stats.team,
    territory_stats.season,
    territory_stats.day,
    territories.name AS territory_name,
    teams.tname AS team_name,
    teams.color_1 AS color,
    teams.color_2 AS secondary_color,
    territory_ownership_without_neighbors.owner AS tname,
    territory_ownership_without_neighbors.prev_owner,
    territory_ownership_without_neighbors.mvp
   FROM (((public.territory_stats
     JOIN public.territories ON ((territories.id = territory_stats.territory)))
     JOIN public.teams ON ((teams.id = territory_stats.team)))
     JOIN public.territory_ownership_without_neighbors ON (((territory_ownership_without_neighbors.name = territories.name) AND (territory_ownership_without_neighbors.season = territory_stats.season) AND (territory_ownership_without_neighbors.day = (territory_stats.day + 1)))));


ALTER TABLE public.odds OWNER TO postgres;

--
-- Name: past_turns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.past_turns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.past_turns_id_seq OWNER TO postgres;

--
-- Name: past_turns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.past_turns_id_seq OWNED BY public.past_turns.id;


--
-- Name: players; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.players AS
 SELECT users.id,
    users.uname,
    users.platform,
    users.current_team,
    users.overall,
    users.turns,
    users.game_turns,
    users.mvps,
    users.streak,
    users.awards,
    teams.tname
   FROM (public.users
     JOIN public.teams ON ((teams.id = users.current_team)));


ALTER TABLE public.players OWNER TO postgres;

--
-- Name: turninfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.turninfo (
    id integer NOT NULL,
    season integer,
    day integer,
    complete boolean,
    active boolean,
    finale boolean,
    chaosrerolls integer DEFAULT 0,
    chaosweight integer DEFAULT 1,
    rollendtime timestamp without time zone,
    rollstarttime timestamp without time zone
);


ALTER TABLE public.turninfo OWNER TO postgres;

--
-- Name: rollinfo; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.rollinfo AS
 SELECT (turninfo.rollstarttime)::text AS rollstarttime,
    (turninfo.rollendtime)::text AS rollendtime,
    turninfo.chaosrerolls,
    turninfo.chaosweight,
    territory_ownership_without_neighbors.day,
    territory_ownership_without_neighbors.season,
    json_agg(json_build_object('territory', territory_ownership_without_neighbors.name, 'timestamp', territory_ownership_without_neighbors."timestamp", 'winner', territory_ownership_without_neighbors.owner, 'randomNumber', territory_ownership_without_neighbors.random_number)) AS json_agg
   FROM (public.territory_ownership_without_neighbors
     JOIN public.turninfo ON (((turninfo.day = territory_ownership_without_neighbors.day) AND (turninfo.season = territory_ownership_without_neighbors.season))))
  GROUP BY territory_ownership_without_neighbors.day, territory_ownership_without_neighbors.season, turninfo.chaosrerolls, turninfo.rollstarttime, turninfo.rollendtime, turninfo.chaosweight;


ALTER TABLE public.rollinfo OWNER TO postgres;

--
-- Name: stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stats (
    sequence integer,
    season integer,
    day integer,
    team integer,
    rank integer,
    territorycount integer,
    playercount integer,
    merccount integer,
    starpower double precision,
    efficiency double precision,
    effectivepower double precision,
    ones integer,
    twos integer,
    threes integer,
    fours integer,
    fives integer
);


ALTER TABLE public.stats OWNER TO postgres;

--
-- Name: statistics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.statistics AS
 SELECT stats.sequence,
    stats.season,
    stats.day,
    stats.team,
    stats.rank,
    stats.territorycount,
    stats.playercount,
    stats.merccount,
    stats.starpower,
    stats.starpower AS stars,
    stats.efficiency,
    stats.effectivepower,
    stats.ones,
    stats.twos,
    stats.threes,
    stats.fours,
    stats.fives,
    teams.tname,
    teams.logo
   FROM (public.stats
     JOIN public.teams ON ((teams.id = stats.team)));


ALTER TABLE public.statistics OWNER TO postgres;

--
-- Name: team_player_moves; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.team_player_moves AS
 SELECT past_turns.id,
    past_turns.season,
    past_turns.day,
    teams.tname AS team,
    players.uname AS player,
    past_turns.stars,
    past_turns.mvp,
    territories.name AS territory,
    players.tname AS regularteam,
    past_turns.weight,
    past_turns.power,
    past_turns.multiplier
   FROM (((public.past_turns
     JOIN public.territories ON ((territories.id = past_turns.territory)))
     JOIN public.teams ON ((teams.id = past_turns.team)))
     JOIN public.players ON ((players.id = past_turns.user_id)))
  ORDER BY territories.name, past_turns.team;


ALTER TABLE public.team_player_moves OWNER TO postgres;

--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.teams_id_seq OWNER TO postgres;

--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: territory_adjacency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.territory_adjacency (
    id integer,
    territory_id integer,
    adjacent_id integer
);


ALTER TABLE public.territory_adjacency OWNER TO postgres;

--
-- Name: territory_adjacency_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.territory_adjacency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.territory_adjacency_id_seq OWNER TO postgres;

--
-- Name: territory_adjacency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.territory_adjacency_id_seq OWNED BY public.territory_adjacency.id;


--
-- Name: territory_neighbor_history; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.territory_neighbor_history AS
 SELECT territory_ownership.day,
    territory_ownership.season,
    territory_adjacency.territory_id AS id,
    json_agg(json_build_object('id', territory_ownership.territory_id, 'name', territories.name, 'shortName', territories.name, 'owner', teams.tname)) AS neighbors
   FROM (((public.territory_adjacency
     JOIN public.territory_ownership ON ((territory_ownership.territory_id = territory_adjacency.adjacent_id)))
     JOIN public.teams ON ((teams.id = territory_ownership.owner_id)))
     JOIN public.territories ON ((territories.id = territory_ownership.territory_id)))
  WHERE (territory_adjacency.territory_id <> territory_adjacency.adjacent_id)
  GROUP BY territory_adjacency.territory_id, territory_ownership.season, territory_ownership.day
  ORDER BY territory_adjacency.territory_id;


ALTER TABLE public.territory_neighbor_history OWNER TO postgres;

--
-- Name: territory_ownership_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.territory_ownership_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.territory_ownership_id_seq OWNER TO postgres;

--
-- Name: territory_ownership_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.territory_ownership_id_seq OWNED BY public.territory_ownership.id;


--
-- Name: territory_ownership_with_neighbors; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.territory_ownership_with_neighbors AS
 SELECT territory_ownership.territory_id,
    territory_ownership.day,
    territory_ownership.season,
    territories.name,
    teams.tname,
    territory_neighbor_history.neighbors
   FROM (((public.territory_ownership
     JOIN public.teams ON ((teams.id = territory_ownership.owner_id)))
     JOIN public.territories ON ((territory_ownership.territory_id = territories.id)))
     JOIN public.territory_neighbor_history ON ((territory_ownership.territory_id = territory_neighbor_history.id)))
  WHERE ((territory_ownership.day = territory_neighbor_history.day) AND (territory_ownership.season = territory_neighbor_history.season));


ALTER TABLE public.territory_ownership_with_neighbors OWNER TO postgres;

--
-- Name: territory_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.territory_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.territory_stats_id_seq OWNER TO postgres;

--
-- Name: territory_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.territory_stats_id_seq OWNED BY public.territory_stats.id;


--
-- Name: turninfo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.turninfo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.turninfo_id_seq OWNER TO postgres;

--
-- Name: turninfo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.turninfo_id_seq OWNED BY public.turninfo.id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhooks (
    id integer NOT NULL,
    uri character varying(100) NOT NULL,
    user_id integer NOT NULL,
    subscriptions character varying(100) DEFAULT 'image'::character varying NOT NULL,
    failed boolean NOT NULL
);


ALTER TABLE public.webhooks OWNER TO postgres;

--
-- Name: webhooks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.webhooks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.webhooks_id_seq OWNER TO postgres;

--
-- Name: webhooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.webhooks_id_seq OWNED BY public.webhooks.id;


--
-- Name: captchas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.captchas ALTER COLUMN id SET DEFAULT nextval('public.captchas_id_seq'::regclass);


--
-- Name: new_turns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.new_turns ALTER COLUMN id SET DEFAULT nextval('public.new_turns_id_seq'::regclass);


--
-- Name: past_turns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.past_turns ALTER COLUMN id SET DEFAULT nextval('public.past_turns_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: territory_ownership id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_ownership ALTER COLUMN id SET DEFAULT nextval('public.territory_ownership_id_seq'::regclass);


--
-- Name: territory_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_stats ALTER COLUMN id SET DEFAULT nextval('public.territory_stats_id_seq'::regclass);


--
-- Name: turninfo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turninfo ALTER COLUMN id SET DEFAULT nextval('public.turninfo_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: webhooks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks ALTER COLUMN id SET DEFAULT nextval('public.webhooks_id_seq'::regclass);


--
-- Name: __diesel_schema_migrations __diesel_schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.__diesel_schema_migrations
    ADD CONSTRAINT __diesel_schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: captchas captchas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.captchas
    ADD CONSTRAINT captchas_pkey PRIMARY KEY (id);


--
-- Name: new_turns new_turns_user_id_season_day_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.new_turns
    ADD CONSTRAINT new_turns_user_id_season_day_key UNIQUE (user_id, season, day);


--
-- Name: past_turns past_turns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.past_turns
    ADD CONSTRAINT past_turns_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: territories territories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territories
    ADD CONSTRAINT territories_pkey PRIMARY KEY (id);


--
-- Name: territory_adjacency territory_adjacency_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_adjacency
    ADD CONSTRAINT territory_adjacency_id_key UNIQUE (id);


--
-- Name: territory_ownership territory_ownership_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.territory_ownership
    ADD CONSTRAINT territory_ownership_pkey PRIMARY KEY (id);


--
-- Name: turninfo turninfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turninfo
    ADD CONSTRAINT turninfo_pkey PRIMARY KEY (id);


--
-- Name: users unique_table; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_table UNIQUE (uname, platform);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

