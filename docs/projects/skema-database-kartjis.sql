--
-- PostgreSQL database dump
--

\restrict tD7DetRNZycXnbZPXykFqkSsopeo2YVsfxYkHPsmdJH7u6Gde53axS9FmYY12vg

-- Dumped from database version 16.1 (Debian 16.1-1.pgdg120+1)
-- Dumped by pg_dump version 16.13 (Homebrew)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: event_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.event_type_enum AS ENUM (
    'RSVP',
    'DEFAULT'
);


ALTER TYPE public.event_type_enum OWNER TO postgres;

--
-- Name: media_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.media_type_enum AS ENUM (
    'wristband',
    'id_card',
    'nfc_tag',
    'other'
);


ALTER TYPE public.media_type_enum OWNER TO postgres;

--
-- Name: social_media_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.social_media_type AS ENUM (
    'instagram',
    'tiktok',
    'twitter',
    'youtube',
    'spotify',
    'website'
);


ALTER TYPE public.social_media_type OWNER TO postgres;

--
-- Name: staff_assignment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.staff_assignment_status AS ENUM (
    'active',
    'inactive',
    'off_duty',
    'on_leave',
    'suspended'
);


ALTER TYPE public.staff_assignment_status OWNER TO postgres;

--
-- Name: create_sync_log_entry(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_sync_log_entry() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
	row_data jsonb;
	event_id text := '';
	sync_source text := COALESCE(NULLIF(current_setting('app.sync_source', true), ''), 'local');
	changed_at_text text := NULLIF(current_setting('app.sync_changed_at', true), '');
	log_changed_at timestamp := COALESCE(changed_at_text::timestamp, timezone('utc', now()));
	logged_table_name text := TG_TABLE_NAME;
BEGIN
	IF TG_OP = 'DELETE' THEN
		row_data := to_jsonb(OLD);
	ELSE
		row_data := to_jsonb(NEW);
	END IF;

	CASE TG_TABLE_NAME
		WHEN 'ticket_verification' THEN
			logged_table_name := 'ticket_verifications';
			SELECT t.event_id INTO event_id
			FROM tickets t
			WHERE t.id::text = COALESCE(row_data->>'ticket_id', '')
			   OR t.code = COALESCE(row_data->>'ticket_code', '')
			LIMIT 1;
		WHEN 'ticket_custom_fields' THEN
			SELECT t.event_id INTO event_id FROM tickets t WHERE t.id::text = COALESCE(row_data->>'ticket_id', '') LIMIT 1;
		WHEN 'transactions' THEN
			SELECT t.event_id INTO event_id FROM tickets t WHERE t.order_id::text = COALESCE(row_data->>'order_id', '') LIMIT 1;
		WHEN 'orders' THEN
			SELECT t.event_id INTO event_id FROM tickets t WHERE t.order_id::text = COALESCE(row_data->>'id', '') LIMIT 1;
		WHEN 'tickets' THEN
			event_id := COALESCE(row_data->>'event_id', '');
		WHEN 'ticket_categories' THEN
			event_id := COALESCE(row_data->>'event_id', '');
	END CASE;

	row_data := row_data || jsonb_build_object('event_id', COALESCE(event_id, ''));

	INSERT INTO sync_logs (table_name, record_id, action, changed_at, source, payload)
	VALUES (
		logged_table_name,
		COALESCE(row_data->>'id', ''),
		LOWER(TG_OP),
		log_changed_at,
		sync_source,
		row_data
	)
	ON CONFLICT (table_name, record_id, changed_at) DO NOTHING;

	IF TG_OP = 'DELETE' THEN
		RETURN OLD;
	END IF;
	RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_sync_log_entry() OWNER TO postgres;

--
-- Name: get_order_totals_by_category(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_order_totals_by_category(p_ticket_category_id character varying) RETURNS TABLE(total_amount bigint, admin_fees integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
--    SELECT
--        SUM(o.total_amount) AS total_amount,
--        SUM(o.admin_fees) AS admin_fees
--    FROM
--        orders o
--    WHERE
--        o.id IN (
--            SELECT DISTINCT t.order_id
--            FROM tickets t
--            WHERE t.ticket_category_id = p_ticket_category_id
--        )
--        AND o.order_status_id = 1;
	select
		sum(price) AS total_amount,
		0 as admin_fees
	from
		tickets t
		join orders o on t.order_id = o.id 
	where
		t.ticket_category_id = p_ticket_category_id and o.order_status_id = 1;
END;
$$;


ALTER FUNCTION public.get_order_totals_by_category(p_ticket_category_id character varying) OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- Name: update_event_view_counts(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_event_view_counts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  is_duplicate BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM event_views
    WHERE event_id  = NEW.event_id
      AND viewed_at >= NOW() - INTERVAL '24 hours'
      AND id        != NEW.id
      AND (
        (NEW.user_id IS NOT NULL AND user_id = NEW.user_id)
        OR
        (NEW.user_id IS NULL AND ip_address = NEW.ip_address)
      )
  ) INTO is_duplicate;

  INSERT INTO event_view_counts (event_id, total_views, unique_views, updated_at)
  VALUES (
    NEW.event_id,
    1,
    CASE WHEN is_duplicate THEN 0 ELSE 1 END,
    NOW()
  )
  ON CONFLICT (event_id) DO UPDATE SET
    total_views  = event_view_counts.total_views + 1,
    unique_views = event_view_counts.unique_views + CASE WHEN is_duplicate THEN 0 ELSE 1 END,
    updated_at   = NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_event_view_counts() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform character varying(10) NOT NULL,
    version character varying(20) NOT NULL,
    version_code integer NOT NULL,
    update_type character varying(20) DEFAULT 'none'::character varying,
    title character varying(255),
    message text,
    store_url character varying(255),
    is_active boolean DEFAULT true,
    released_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_platform CHECK (((platform)::text = ANY ((ARRAY['android'::character varying, 'ios'::character varying])::text[]))),
    CONSTRAINT chk_update_type CHECK (((update_type)::text = ANY ((ARRAY['mandatory'::character varying, 'optional'::character varying, 'none'::character varying])::text[])))
);


ALTER TABLE public.app_versions OWNER TO postgres;

--
-- Name: authorizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.authorizations (
    id character(36) NOT NULL,
    access_token_expires_at timestamp(6) with time zone NOT NULL,
    access_token_value character varying(1000) NOT NULL,
    principal_name character varying(255) NOT NULL,
    refresh_token_expires_at timestamp(6) with time zone NOT NULL,
    refresh_token_value character varying(1000) NOT NULL
);


ALTER TABLE public.authorizations OWNER TO postgres;

--
-- Name: cities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    province_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cities OWNER TO postgres;

--
-- Name: event_carousels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_carousels (
    id character(36) NOT NULL,
    event_id character(36) NOT NULL,
    display_order integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.event_carousels OWNER TO postgres;

--
-- Name: event_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_categories (
    id character(36) NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.event_categories OWNER TO postgres;

--
-- Name: event_custom_fields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_custom_fields (
    id character(36) NOT NULL,
    is_required boolean NOT NULL,
    name character varying(255) NOT NULL,
    event_id character(36) NOT NULL,
    option text,
    type character varying(255)
);


ALTER TABLE public.event_custom_fields OWNER TO postgres;

--
-- Name: event_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    city_id uuid,
    venue_map_url character varying(255),
    venue_map_image character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    queue_enabled boolean DEFAULT false,
    queue_threshold integer DEFAULT 100,
    queue_batch_size integer DEFAULT 50,
    queue_batch_interval integer DEFAULT 5,
    queue_access_ttl integer DEFAULT 600,
    event_type public.event_type_enum DEFAULT 'DEFAULT'::public.event_type_enum NOT NULL,
    admin_whatsapp character varying(255),
    bank_name character varying(255),
    bank_branch character varying(255),
    bank_account_number character varying(100),
    bank_account_name character varying(255)
);


ALTER TABLE public.event_details OWNER TO postgres;

--
-- Name: event_facilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_facilities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    facility_id uuid NOT NULL,
    notes character varying(255),
    quantity integer DEFAULT 1
);


ALTER TABLE public.event_facilities OWNER TO postgres;

--
-- Name: event_gates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_gates (
    id character(36) NOT NULL,
    event_id text NOT NULL,
    allow_unverify boolean,
    allow_app_scanning boolean,
    allow_manual_verification boolean,
    allow_ots boolean,
    redemption_start timestamp(6) without time zone,
    redemption_end timestamp(6) without time zone,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    name character varying(100) DEFAULT 'Main'::character varying NOT NULL,
    allow_generate boolean DEFAULT false NOT NULL,
    allow_access_support_center boolean DEFAULT false NOT NULL,
    allow_check_visualization boolean DEFAULT false NOT NULL,
    allow_design_card boolean DEFAULT false NOT NULL,
    allow_wristband_redemption boolean DEFAULT true NOT NULL
);


ALTER TABLE public.event_gates OWNER TO postgres;

--
-- Name: event_organizers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_organizers (
    id character(36) NOT NULL,
    username character varying(255) NOT NULL,
    event_id character(36)
);


ALTER TABLE public.event_organizers OWNER TO postgres;

--
-- Name: event_photo_quotas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_photo_quotas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    used_quota integer DEFAULT 0,
    max_quota integer DEFAULT 2,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.event_photo_quotas OWNER TO postgres;

--
-- Name: event_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    ticket_id character varying(255) NOT NULL,
    photo_url character varying(255) NOT NULL,
    caption character varying(255),
    is_approved boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    canvas_ratio character varying(10) DEFAULT 'square'::character varying,
    CONSTRAINT chk_canvas_ratio CHECK (((canvas_ratio)::text = ANY ((ARRAY['square'::character varying, 'story'::character varying])::text[])))
);


ALTER TABLE public.event_photos OWNER TO postgres;

--
-- Name: event_social_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_social_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    type public.social_media_type NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.event_social_media OWNER TO postgres;

--
-- Name: event_staff_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_staff_permissions (
    id character(36) NOT NULL,
    event_id character(36) NOT NULL,
    staff_id character(36) NOT NULL,
    allow_qr_scanning boolean DEFAULT false NOT NULL,
    allow_unverify boolean DEFAULT false NOT NULL,
    allow_manual_verification boolean DEFAULT false NOT NULL,
    allow_ots boolean DEFAULT false NOT NULL,
    allow_wristband boolean DEFAULT false NOT NULL,
    allow_generate boolean DEFAULT false NOT NULL,
    allow_access_support_center boolean DEFAULT false NOT NULL,
    allow_check_visualization boolean DEFAULT false NOT NULL,
    allow_design_card boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.event_staff_permissions OWNER TO postgres;

--
-- Name: event_staffs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_staffs (
    id character(36) NOT NULL,
    staff_user_id character varying(100) NOT NULL,
    event_id character varying(100) NOT NULL,
    max_ticket_quota integer,
    status public.staff_assignment_status DEFAULT 'active'::public.staff_assignment_status NOT NULL
);


ALTER TABLE public.event_staffs OWNER TO postgres;

--
-- Name: event_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_statuses (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.event_statuses OWNER TO postgres;

--
-- Name: event_talents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_talents (
    id character(36) NOT NULL,
    image_url character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    event_id character(36) NOT NULL
);


ALTER TABLE public.event_talents OWNER TO postgres;

--
-- Name: event_view_counts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_view_counts (
    event_id character varying(255) NOT NULL,
    total_views bigint DEFAULT 0,
    unique_views bigint DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.event_view_counts OWNER TO postgres;

--
-- Name: event_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    user_id character varying(255),
    ip_address character varying(45),
    user_agent character varying(500),
    viewed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.event_views OWNER TO postgres;

--
-- Name: event_whatsapp_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_whatsapp_sessions (
    id text NOT NULL,
    event_id text NOT NULL,
    session_name text NOT NULL,
    phone_number text,
    status text DEFAULT 'not_configured'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by text,
    connected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_whatsapp_sessions OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id character(36) NOT NULL,
    approved boolean,
    category character varying(255),
    city character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    contact_person character varying(255),
    copy_data_setting boolean NOT NULL,
    description character varying(5000),
    detail_image character varying(255),
    end_date timestamp(6) with time zone NOT NULL,
    end_date_offset character varying(255) NOT NULL,
    location character varying(255) NOT NULL,
    location_link character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    province character varying(255) NOT NULL,
    slide_image character varying(255),
    start_date timestamp(6) with time zone,
    start_date_offset character varying(255),
    terms_of_condition character varying(2000),
    thumbnail_image character varying(255),
    terms_and_condition character varying(2000),
    event_status_id integer NOT NULL,
    admin_fee integer DEFAULT 10000
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: facilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facilities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(255),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.facilities OWNER TO postgres;

--
-- Name: fees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fees (
    payment_type character varying(20) NOT NULL,
    fee numeric(10,2) NOT NULL,
    is_percentage boolean DEFAULT false NOT NULL
);


ALTER TABLE public.fees OWNER TO postgres;

--
-- Name: general_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.general_option (
    id character varying(255) NOT NULL,
    value character varying(255)
);


ALTER TABLE public.general_option OWNER TO postgres;

--
-- Name: http_request_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.http_request_records (
    id character(36) NOT NULL,
    date timestamp(6) with time zone,
    endpoint character varying(255),
    handler character varying(255),
    method character varying(255),
    status character varying(255)
);


ALTER TABLE public.http_request_records OWNER TO postgres;

--
-- Name: kafka_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kafka_messages (
    id character(36) NOT NULL,
    data character varying(255),
    event_type character varying(255),
    status character varying(255),
    topic character varying(255)
);


ALTER TABLE public.kafka_messages OWNER TO postgres;

--
-- Name: order_helper; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_helper (
    id character(36) NOT NULL,
    created_at timestamp(6) without time zone,
    fail_code integer,
    fail_reason character varying(255),
    order_id character varying(255),
    processing boolean NOT NULL,
    success boolean NOT NULL,
    updated_at timestamp(6) without time zone
);


ALTER TABLE public.order_helper OWNER TO postgres;

--
-- Name: order_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_statuses (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.order_statuses OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id character varying(255) NOT NULL,
    date timestamp(6) with time zone NOT NULL,
    total_amount bigint NOT NULL,
    admin_fees bigint,
    entry_by character varying(255),
    order_status_id integer NOT NULL,
    customer_id character varying(255),
    payment_url character varying(1000),
    expired_date timestamp with time zone,
    deleted boolean,
    deleted_at timestamp with time zone,
    deleted_by text,
    promo_id character varying(255),
    promo_code character varying(255),
    subtotal_amount bigint,
    discount_amount bigint DEFAULT 0
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: otp_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_verifications (
    id character(36) NOT NULL,
    attempt_count integer NOT NULL,
    created_at timestamp(6) without time zone,
    email character varying(255),
    expires_at timestamp(6) without time zone,
    is_verified boolean NOT NULL,
    otp integer NOT NULL
);


ALTER TABLE public.otp_verifications OWNER TO postgres;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id character(36) NOT NULL,
    created_at timestamp(6) without time zone,
    email character varying(255),
    expires_at timestamp(6) without time zone,
    token character varying(255),
    used boolean NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: promos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promos (
    id character(36) NOT NULL,
    event_id character(36) NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    discount_type character varying(255) NOT NULL,
    discount_value integer NOT NULL,
    min_amount integer,
    max_discount integer,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    active boolean NOT NULL,
    created_by_type character varying(255) NOT NULL,
    created_by character varying(255) NOT NULL,
    max_redemptions integer NOT NULL,
    redeemed_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT chk_promos_created_by_type CHECK (((created_by_type)::text = ANY (ARRAY[('ADMIN'::character varying)::text, ('ORGANIZER'::character varying)::text]))),
    CONSTRAINT chk_promos_discount_type CHECK (((discount_type)::text = ANY (ARRAY[('PERCENTAGE'::character varying)::text, ('FIXED_AMOUNT'::character varying)::text]))),
    CONSTRAINT chk_promos_discount_value CHECK ((discount_value > 0)),
    CONSTRAINT chk_promos_max_discount CHECK (((max_discount IS NULL) OR (max_discount >= 0))),
    CONSTRAINT chk_promos_max_redemptions CHECK ((max_redemptions > 0)),
    CONSTRAINT chk_promos_min_amount CHECK (((min_amount IS NULL) OR (min_amount >= 0))),
    CONSTRAINT chk_promos_redeemed_count CHECK ((redeemed_count >= 0))
);


ALTER TABLE public.promos OWNER TO postgres;

--
-- Name: provinces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provinces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.provinces OWNER TO postgres;

--
-- Name: rsvp_blast_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rsvp_blast_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    file_name character varying(255),
    message text NOT NULL,
    total_contacts integer DEFAULT 0,
    sent_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    status character varying(20) DEFAULT 'draft'::character varying,
    blasted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.rsvp_blast_batches OWNER TO postgres;

--
-- Name: rsvp_blast_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rsvp_blast_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    batch_id uuid NOT NULL,
    name character varying(255),
    whatsapp character varying(20) NOT NULL,
    email character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    sent_at timestamp with time zone,
    error_message character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.rsvp_blast_contacts OWNER TO postgres;

--
-- Name: rsvp_payment_proofs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rsvp_payment_proofs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL,
    file_name character varying(255),
    uploaded_by character varying(20) DEFAULT 'guest'::character varying,
    notes character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.rsvp_payment_proofs OWNER TO postgres;

--
-- Name: sync_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_logs (
    id integer NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL,
    changed_at timestamp without time zone NOT NULL,
    source text NOT NULL,
    payload jsonb
);


ALTER TABLE public.sync_logs OWNER TO postgres;

--
-- Name: sync_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_logs_id_seq OWNER TO postgres;

--
-- Name: sync_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_logs_id_seq OWNED BY public.sync_logs.id;


--
-- Name: sync_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_metadata (
    id integer NOT NULL,
    last_pull_at timestamp without time zone,
    last_push_at timestamp without time zone,
    event_id text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.sync_metadata OWNER TO postgres;

--
-- Name: sync_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_metadata_id_seq OWNER TO postgres;

--
-- Name: sync_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_metadata_id_seq OWNED BY public.sync_metadata.id;


--
-- Name: ticket_associations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_associations (
    id character varying(255) NOT NULL,
    ticket_id character varying(255) NOT NULL,
    physical_uid character varying(255) NOT NULL,
    media_type public.media_type_enum DEFAULT 'wristband'::public.media_type_enum,
    paired_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    check_in_at timestamp with time zone,
    check_out_at timestamp with time zone
);


ALTER TABLE public.ticket_associations OWNER TO postgres;

--
-- Name: ticket_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_categories (
    id character(36) NOT NULL,
    maximum_tickets_per_transaction integer,
    name character varying(255) NOT NULL,
    price integer NOT NULL,
    sales_end_time timestamp(6) with time zone NOT NULL,
    sales_end_time_offset character varying(255) NOT NULL,
    sales_start_time timestamp(6) with time zone,
    sales_start_time_offset character varying(255),
    stock integer NOT NULL,
    terms_and_conditions text,
    event_id character(36) NOT NULL,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    ticket_category_status_id integer NOT NULL,
    staff_only boolean,
    "position" integer,
    valid_from timestamp(6) with time zone,
    valid_until timestamp(6) with time zone
);


ALTER TABLE public.ticket_categories OWNER TO postgres;

--
-- Name: ticket_category_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_category_statuses (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.ticket_category_statuses OWNER TO postgres;

--
-- Name: ticket_custom_fields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_custom_fields (
    id character(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255) NOT NULL,
    ticket_id character(36) NOT NULL
);


ALTER TABLE public.ticket_custom_fields OWNER TO postgres;

--
-- Name: ticket_verification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_verification (
    id character(36) NOT NULL,
    hash character varying(255),
    scan_device character varying(255),
    scanned_at timestamp(6) without time zone,
    scanned_by character varying(255),
    ticket_code character varying(255),
    ticket_id character varying(255),
    un_scanned_at timestamp(6) without time zone,
    un_scanned_by character varying(255)
);


ALTER TABLE public.ticket_verification OWNER TO postgres;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id character(36) NOT NULL,
    code character varying(255) NOT NULL,
    customer_email character varying(255) NOT NULL,
    customer_gender character varying(255) NOT NULL,
    customer_name character varying(255) NOT NULL,
    event_id character(36) NOT NULL,
    order_id character varying(255) NOT NULL,
    ticket_category_id character(36) NOT NULL,
    customer_phone_number character varying(255) NOT NULL,
    price integer NOT NULL
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: transaction_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_statuses (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.transaction_statuses OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id character(36) NOT NULL,
    amount bigint NOT NULL,
    date timestamp(6) with time zone NOT NULL,
    order_id character varying(255) NOT NULL,
    source character varying(255) NOT NULL,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    payment_type character varying(50),
    transaction_status_id integer NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_devices (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    fcm_token character varying(255),
    platform character varying(20),
    type character varying(20),
    model character varying(100),
    device_identifier character varying(255) NOT NULL,
    app_name character varying(100),
    app_version character varying(20),
    last_active_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_devices OWNER TO postgres;

--
-- Name: user_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_devices_id_seq OWNER TO postgres;

--
-- Name: user_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_devices_id_seq OWNED BY public.user_devices.id;


--
-- Name: user_social_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_social_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    provider character varying(20) NOT NULL,
    provider_uid character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255),
    avatar_url character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_social_accounts OWNER TO postgres;

--
-- Name: user_what_news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_what_news (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    what_news_id uuid NOT NULL,
    seen_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_what_news OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character(36) NOT NULL,
    alternative_name character varying(255),
    contact character varying(255),
    email character varying(255) NOT NULL,
    gender character varying(255),
    name character varying(255),
    password character varying(255) NOT NULL,
    roles character varying(255) NOT NULL,
    supervisor_id character varying(255),
    username character varying(255) NOT NULL,
    address character varying(255),
    ktp_image character varying(255),
    npwp_image character varying(255),
    profile_image character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    enable boolean DEFAULT true NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_detail (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    loyalty_points double precision DEFAULT 0,
    loyalty_tier character varying(50) DEFAULT 'bronze'::character varying,
    last_login_at timestamp with time zone,
    last_login_ip character varying(45),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    city_id uuid,
    province_id uuid
);


ALTER TABLE public.users_detail OWNER TO postgres;

--
-- Name: users_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_detail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_detail_id_seq OWNER TO postgres;

--
-- Name: users_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_detail_id_seq OWNED BY public.users_detail.id;


--
-- Name: view_event_detail; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_event_detail AS
SELECT
    NULL::character(36) AS event_id,
    NULL::boolean AS event_approved,
    NULL::character varying(255) AS event_category,
    NULL::character varying(255) AS event_city,
    NULL::character varying(255) AS event_code,
    NULL::character varying(255) AS event_contact_person,
    NULL::boolean AS event_copy_data_setting,
    NULL::character varying(5000) AS event_description,
    NULL::character varying(255) AS event_detail_image,
    NULL::timestamp(6) with time zone AS event_end_date,
    NULL::character varying(255) AS event_end_date_offset,
    NULL::character varying(255) AS event_location,
    NULL::character varying(255) AS event_location_link,
    NULL::character varying(255) AS event_name,
    NULL::character varying(255) AS event_province,
    NULL::character varying(255) AS event_slide_image,
    NULL::timestamp(6) with time zone AS event_start_date,
    NULL::character varying(255) AS event_start_date_offset,
    NULL::character varying(255) AS event_thumbnail_image,
    NULL::character varying(2000) AS event_terms_and_condition,
    NULL::character varying(255) AS event_organizer,
    NULL::character varying(255) AS event_organizer_logo,
    NULL::integer AS event_status_id,
    NULL::character varying(255) AS event_status_name,
    NULL::bigint AS event_talent_count,
    NULL::boolean AS ticket_category_is_free,
    NULL::bigint AS ticket_category_total_price,
    NULL::integer AS ticket_category_smallest_price,
    NULL::integer AS ticket_category_largest_price,
    NULL::text AS event_custom_fields;


ALTER VIEW public.view_event_detail OWNER TO postgres;

--
-- Name: view_staff_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.view_staff_events (
    username character varying(255) NOT NULL,
    event_id character varying(255),
    supervisor_id character varying(255)
);


ALTER TABLE public.view_staff_events OWNER TO postgres;

--
-- Name: view_ticket_detail; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_ticket_detail AS
 SELECT a.id AS ticket_id,
    a.code AS ticket_code,
    a.customer_email AS ticket_customer_email,
    a.customer_gender AS ticket_customer_gender,
    a.customer_name AS ticket_customer_name,
    a.customer_phone_number AS ticket_customer_phone_number,
    a.order_id,
    a.price AS ticket_price,
    b.order_status_id,
    h.name AS order_status_name,
    b.total_amount AS order_total_amount,
    b.date AS order_date,
    b.customer_id AS order_customer_id,
    a.ticket_category_id,
    d.name AS ticket_category_name,
    d.ticket_category_status_id,
    j.name AS ticket_category_status_name,
    a.event_id,
    e.name AS event_name,
    e.start_date AS event_start_date,
    e.end_date AS event_end_date,
    e.event_status_id,
    g.name AS event_status_name,
    f.username AS event_organizer_username,
    e.thumbnail_image AS event_thumbnail_image,
    k.id AS transaction_id,
    k.amount AS transaction_amount,
    k.source AS transaction_source,
    k.transaction_status_id,
    l.name AS transaction_status_name,
    k.payment_type AS transaction_payment_type,
    k.date AS transaction_date
   FROM (((((((((public.tickets a
     JOIN public.orders b ON (((a.order_id)::text = (b.id)::text)))
     LEFT JOIN public.ticket_categories d ON ((a.ticket_category_id = d.id)))
     LEFT JOIN public.events e ON ((a.event_id = e.id)))
     LEFT JOIN public.event_organizers f ON ((e.id = f.event_id)))
     LEFT JOIN public.event_statuses g ON ((e.event_status_id = g.id)))
     JOIN public.order_statuses h ON ((b.order_status_id = h.id)))
     JOIN public.ticket_category_statuses j ON ((d.ticket_category_status_id = j.id)))
     LEFT JOIN public.transactions k ON (((a.order_id)::text = (k.order_id)::text)))
     LEFT JOIN public.transaction_statuses l ON ((k.transaction_status_id = l.id)));


ALTER VIEW public.view_ticket_detail OWNER TO postgres;

--
-- Name: view_ticket_category_stock; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_ticket_category_stock AS
 SELECT a.id AS ticket_category_id,
    a.event_id,
    a.stock AS ticket_category_stock,
    COALESCE(b.completed_orders, (0)::bigint) AS completed_orders,
    COALESCE(b1.pending_orders, (0)::bigint) AS pending_orders,
    ((a.stock - COALESCE(b.completed_orders, (0)::bigint)) - COALESCE(b1.pending_orders, (0)::bigint)) AS available_stock
   FROM ((public.ticket_categories a
     LEFT JOIN ( SELECT view_ticket_detail.ticket_category_id,
            count(*) AS completed_orders
           FROM public.view_ticket_detail
          WHERE ((view_ticket_detail.order_status_id = 1) AND (view_ticket_detail.transaction_status_id = 1))
          GROUP BY view_ticket_detail.ticket_category_id) b ON ((a.id = b.ticket_category_id)))
     LEFT JOIN ( SELECT view_ticket_detail.ticket_category_id,
            count(*) AS pending_orders
           FROM public.view_ticket_detail
          WHERE (view_ticket_detail.order_status_id = 2)
          GROUP BY view_ticket_detail.ticket_category_id) b1 ON ((a.id = b1.ticket_category_id)));


ALTER VIEW public.view_ticket_category_stock OWNER TO postgres;

--
-- Name: view_ticket_category_stock_daily; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_ticket_category_stock_daily AS
 SELECT md5((((a.ticket_category_id)::text || (a.event_id)::text) || ((b.date)::date)::text)) AS id,
    a.ticket_category_id,
    a.event_id,
    (b.date)::date AS order_date,
    count(a.id) AS ticket_count,
    sum(a.price) AS total_amount
   FROM (public.tickets a
     JOIN public.orders b ON (((a.order_id)::text = (b.id)::text)))
  WHERE ((b.date >= (CURRENT_DATE - '6 days'::interval)) AND (b.order_status_id = 1))
  GROUP BY ((b.date)::date), a.ticket_category_id, a.event_id
  ORDER BY ((b.date)::date);


ALTER VIEW public.view_ticket_category_stock_daily OWNER TO postgres;

--
-- Name: view_ticket_detail_v2; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_ticket_detail_v2 AS
 SELECT a.id AS ticket_id,
    a.code AS ticket_code,
    a.customer_email AS ticket_customer_email,
    a.customer_gender AS ticket_customer_gender,
    a.customer_name AS ticket_customer_name,
    a.customer_phone_number AS ticket_customer_phone_number,
    a.order_id,
    a.price AS ticket_price,
    b.order_status_id,
    h.name AS order_status_name,
    b.total_amount AS order_total_amount,
    b.date AS order_date,
    b.entry_by AS order_entry_by,
    b.customer_id AS order_customer_id,
    a.ticket_category_id,
    d.name AS ticket_category_name,
    d.ticket_category_status_id,
    j.name AS ticket_category_status_name,
    a.event_id,
    e.name AS event_name,
    e.start_date AS event_start_date,
    e.end_date AS event_end_date,
    e.event_status_id,
    g.name AS event_status_name,
    f.username AS event_organizer_username,
    e.thumbnail_image AS event_thumbnail_image,
    k.id AS transaction_id,
    k.amount AS transaction_amount,
    k.source AS transaction_source,
    k.transaction_status_id,
    l.name AS transaction_status_name,
    k.payment_type AS transaction_payment_type,
    k.date AS transaction_date
   FROM (((((((((public.tickets a
     JOIN public.orders b ON (((a.order_id)::text = (b.id)::text)))
     LEFT JOIN public.ticket_categories d ON ((a.ticket_category_id = d.id)))
     LEFT JOIN public.events e ON ((a.event_id = e.id)))
     LEFT JOIN public.event_organizers f ON ((e.id = f.event_id)))
     LEFT JOIN public.event_statuses g ON ((e.event_status_id = g.id)))
     JOIN public.order_statuses h ON ((b.order_status_id = h.id)))
     JOIN public.ticket_category_statuses j ON ((d.ticket_category_status_id = j.id)))
     LEFT JOIN public.transactions k ON (((a.order_id)::text = (k.order_id)::text)))
     LEFT JOIN public.transaction_statuses l ON ((k.transaction_status_id = l.id)));


ALTER VIEW public.view_ticket_detail_v2 OWNER TO postgres;

--
-- Name: view_transaction_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_transaction_details AS
SELECT
    NULL::character(36) AS transaction_id,
    NULL::bigint AS transaction_amount,
    NULL::character varying(255) AS transaction_source,
    NULL::integer AS transaction_status_id,
    NULL::character varying(255) AS transaction_status_name,
    NULL::text AS transaction_date,
    NULL::character varying(255) AS order_id,
    NULL::integer AS order_status_id,
    NULL::character varying(255) AS order_status_name,
    NULL::bigint AS order_total_amount,
    NULL::bigint AS order_admin_fee,
    NULL::text AS order_date,
    NULL::character varying(255) AS order_customer_id,
    NULL::character(36) AS ticket_category_id,
    NULL::character varying(255) AS ticket_category_name,
    NULL::integer AS ticket_category_status_id,
    NULL::character varying(255) AS ticket_category_status_name,
    NULL::character(36) AS event_id,
    NULL::character varying(255) AS event_name,
    NULL::integer AS event_status_id,
    NULL::character varying(255) AS event_status_name;


ALTER VIEW public.view_transaction_details OWNER TO postgres;

--
-- Name: view_transaction_details_v2; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_transaction_details_v2 AS
 SELECT DISTINCT ON (b.id) b.id AS order_id,
    a.updated_at AS transaction_updated,
    a.payment_type AS transaction_payment_type,
    b.order_status_id,
    f.name AS order_status_name,
    b.total_amount AS order_total_amount,
    b.date AS order_date,
    b.expired_date AS order_expired_date,
    b.customer_id AS order_customer_id,
    b.entry_by AS order_entry_by,
    c.ticket_category_id,
    d.name AS ticket_category_name,
    d.ticket_category_status_id,
    g.name AS ticket_category_status_name,
    e.id AS event_id,
    e.name AS event_name,
    e.start_date AS event_start_date,
    e.end_date AS event_end_date,
    e.start_date_offset AS event_start_date_offset,
    e.end_date_offset AS event_end_date_offset,
    e.thumbnail_image AS event_thumbnail_image,
    e.location AS event_location,
    i.id AS event_status_id,
    i.name AS event_status_name,
    b.payment_url AS order_payment_url
   FROM ((((((((public.orders b
     LEFT JOIN public.transactions a ON (((a.order_id)::text = (b.id)::text)))
     LEFT JOIN public.tickets c ON (((b.id)::text = (c.order_id)::text)))
     LEFT JOIN public.ticket_categories d ON ((c.ticket_category_id = d.id)))
     LEFT JOIN public.events e ON ((d.event_id = e.id)))
     LEFT JOIN public.order_statuses f ON ((b.order_status_id = f.id)))
     LEFT JOIN public.ticket_category_statuses g ON ((d.ticket_category_status_id = g.id)))
     LEFT JOIN public.transaction_statuses h ON ((a.transaction_status_id = h.id)))
     LEFT JOIN public.event_statuses i ON ((e.event_status_id = i.id)));


ALTER VIEW public.view_transaction_details_v2 OWNER TO postgres;

--
-- Name: what_news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.what_news (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    app_version_id uuid,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    image_url character varying(255),
    platform character varying(10) DEFAULT 'all'::character varying,
    show_once boolean DEFAULT true,
    is_active boolean DEFAULT true,
    started_at timestamp with time zone,
    expired_at timestamp with time zone,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_what_news_platform CHECK (((platform)::text = ANY ((ARRAY['android'::character varying, 'ios'::character varying, 'all'::character varying])::text[])))
);


ALTER TABLE public.what_news OWNER TO postgres;

--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlists (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    event_id character varying(255) NOT NULL,
    notify_available boolean DEFAULT true,
    notified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.wishlists OWNER TO postgres;

--
-- Name: wishlists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wishlists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wishlists_id_seq OWNER TO postgres;

--
-- Name: wishlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wishlists_id_seq OWNED BY public.wishlists.id;


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawals (
    id character(36) NOT NULL,
    account_holder_name character varying(255) NOT NULL,
    account_number character varying(255) NOT NULL,
    bank_name character varying(255) NOT NULL,
    description character varying(255),
    organizer_id character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    withdrawal_amount integer NOT NULL,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    invoice character varying(255)
);


ALTER TABLE public.withdrawals OWNER TO postgres;

--
-- Name: sync_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_logs ALTER COLUMN id SET DEFAULT nextval('public.sync_logs_id_seq'::regclass);


--
-- Name: sync_metadata id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_metadata ALTER COLUMN id SET DEFAULT nextval('public.sync_metadata_id_seq'::regclass);


--
-- Name: user_devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices ALTER COLUMN id SET DEFAULT nextval('public.user_devices_id_seq'::regclass);


--
-- Name: users_detail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_detail ALTER COLUMN id SET DEFAULT nextval('public.users_detail_id_seq'::regclass);


--
-- Name: wishlists id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists ALTER COLUMN id SET DEFAULT nextval('public.wishlists_id_seq'::regclass);


--
-- Name: app_versions app_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT app_versions_pkey PRIMARY KEY (id);


--
-- Name: authorizations authorizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authorizations
    ADD CONSTRAINT authorizations_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: event_carousels event_carousels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_carousels
    ADD CONSTRAINT event_carousels_pkey PRIMARY KEY (id);


--
-- Name: event_categories event_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_pkey PRIMARY KEY (id);


--
-- Name: event_custom_fields event_custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_custom_fields
    ADD CONSTRAINT event_custom_fields_pkey PRIMARY KEY (id);


--
-- Name: event_details event_details_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_details
    ADD CONSTRAINT event_details_event_id_key UNIQUE (event_id);


--
-- Name: event_details event_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_details
    ADD CONSTRAINT event_details_pkey PRIMARY KEY (id);


--
-- Name: event_facilities event_facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_facilities
    ADD CONSTRAINT event_facilities_pkey PRIMARY KEY (id);


--
-- Name: event_gates event_gates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_gates
    ADD CONSTRAINT event_gates_pkey PRIMARY KEY (id);


--
-- Name: event_organizers event_organizers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_organizers
    ADD CONSTRAINT event_organizers_pkey PRIMARY KEY (id);


--
-- Name: event_photo_quotas event_photo_quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_photo_quotas
    ADD CONSTRAINT event_photo_quotas_pkey PRIMARY KEY (id);


--
-- Name: event_photos event_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_photos
    ADD CONSTRAINT event_photos_pkey PRIMARY KEY (id);


--
-- Name: event_social_media event_social_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_social_media
    ADD CONSTRAINT event_social_media_pkey PRIMARY KEY (id);


--
-- Name: event_staff_permissions event_staff_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_staff_permissions
    ADD CONSTRAINT event_staff_permissions_pkey PRIMARY KEY (id);


--
-- Name: event_staffs event_staffs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_staffs
    ADD CONSTRAINT event_staffs_pkey PRIMARY KEY (id);


--
-- Name: event_statuses event_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_statuses
    ADD CONSTRAINT event_statuses_pkey PRIMARY KEY (id);


--
-- Name: event_talents event_talents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_talents
    ADD CONSTRAINT event_talents_pkey PRIMARY KEY (id);


--
-- Name: event_view_counts event_view_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_view_counts
    ADD CONSTRAINT event_view_counts_pkey PRIMARY KEY (event_id);


--
-- Name: event_views event_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_views
    ADD CONSTRAINT event_views_pkey PRIMARY KEY (id);


--
-- Name: event_whatsapp_sessions event_whatsapp_sessions_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_whatsapp_sessions
    ADD CONSTRAINT event_whatsapp_sessions_event_id_key UNIQUE (event_id);


--
-- Name: event_whatsapp_sessions event_whatsapp_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_whatsapp_sessions
    ADD CONSTRAINT event_whatsapp_sessions_pkey PRIMARY KEY (id);


--
-- Name: event_whatsapp_sessions event_whatsapp_sessions_session_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_whatsapp_sessions
    ADD CONSTRAINT event_whatsapp_sessions_session_name_key UNIQUE (session_name);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: facilities facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_pkey PRIMARY KEY (id);


--
-- Name: fees fees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fees
    ADD CONSTRAINT fees_pkey PRIMARY KEY (payment_type);


--
-- Name: general_option general_option_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.general_option
    ADD CONSTRAINT general_option_pkey PRIMARY KEY (id);


--
-- Name: http_request_records http_request_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.http_request_records
    ADD CONSTRAINT http_request_records_pkey PRIMARY KEY (id);


--
-- Name: kafka_messages kafka_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kafka_messages
    ADD CONSTRAINT kafka_messages_pkey PRIMARY KEY (id);


--
-- Name: order_helper order_helper_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_helper
    ADD CONSTRAINT order_helper_pkey PRIMARY KEY (id);


--
-- Name: order_helper order_helper_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_helper
    ADD CONSTRAINT order_helper_unique UNIQUE (order_id);


--
-- Name: order_statuses order_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_statuses
    ADD CONSTRAINT order_statuses_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: otp_verifications otp_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verifications
    ADD CONSTRAINT otp_verifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: promos promos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promos
    ADD CONSTRAINT promos_pkey PRIMARY KEY (id);


--
-- Name: provinces provinces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_pkey PRIMARY KEY (id);


--
-- Name: rsvp_blast_batches rsvp_blast_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsvp_blast_batches
    ADD CONSTRAINT rsvp_blast_batches_pkey PRIMARY KEY (id);


--
-- Name: rsvp_blast_contacts rsvp_blast_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsvp_blast_contacts
    ADD CONSTRAINT rsvp_blast_contacts_pkey PRIMARY KEY (id);


--
-- Name: rsvp_payment_proofs rsvp_payment_proofs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsvp_payment_proofs
    ADD CONSTRAINT rsvp_payment_proofs_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: sync_metadata sync_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_metadata
    ADD CONSTRAINT sync_metadata_pkey PRIMARY KEY (id);


--
-- Name: ticket_associations ticket_associations_physical_uid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_associations
    ADD CONSTRAINT ticket_associations_physical_uid_key UNIQUE (physical_uid);


--
-- Name: ticket_associations ticket_associations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_associations
    ADD CONSTRAINT ticket_associations_pkey PRIMARY KEY (id);


--
-- Name: ticket_categories ticket_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_categories
    ADD CONSTRAINT ticket_categories_pkey PRIMARY KEY (id);


--
-- Name: ticket_category_statuses ticket_category_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_category_statuses
    ADD CONSTRAINT ticket_category_statuses_pkey PRIMARY KEY (id);


--
-- Name: ticket_custom_fields ticket_custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_custom_fields
    ADD CONSTRAINT ticket_custom_fields_pkey PRIMARY KEY (id);


--
-- Name: ticket_verification ticket_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_verification
    ADD CONSTRAINT ticket_verification_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: transaction_statuses transaction_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_statuses
    ADD CONSTRAINT transaction_statuses_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: event_categories uk1et3muobyw9w9dur2ww8bvhh7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT uk1et3muobyw9w9dur2ww8bvhh7 UNIQUE (name);


--
-- Name: users uk6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: promos uk_promos_event_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promos
    ADD CONSTRAINT uk_promos_event_code UNIQUE (event_id, code);


--
-- Name: tickets uke13ki8l4l6u599ociuljrqka9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT uke13ki8l4l6u599ociuljrqka9 UNIQUE (code);


--
-- Name: users ukr43af9ap4edm43mmtq01oddj6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT ukr43af9ap4edm43mmtq01oddj6 UNIQUE (username);


--
-- Name: transactions ukrthu6t9h3qfej8txljv8msly0; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT ukrthu6t9h3qfej8txljv8msly0 UNIQUE (order_id);


--
-- Name: events uktg20yx4f9jmk6g7wjsil67oo4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT uktg20yx4f9jmk6g7wjsil67oo4 UNIQUE (code);


--
-- Name: event_facilities uq_event_facility; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_facilities
    ADD CONSTRAINT uq_event_facility UNIQUE (event_id, facility_id);


--
-- Name: event_photo_quotas uq_event_photo_quota; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_photo_quotas
    ADD CONSTRAINT uq_event_photo_quota UNIQUE (event_id, user_id);


--
-- Name: event_social_media uq_event_social_media_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_social_media
    ADD CONSTRAINT uq_event_social_media_type UNIQUE (event_id, type);


--
-- Name: event_staff_permissions uq_event_staff; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_staff_permissions
    ADD CONSTRAINT uq_event_staff UNIQUE (event_id, staff_id);


--
-- Name: app_versions uq_platform_version_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT uq_platform_version_code UNIQUE (platform, version_code);


--
-- Name: user_social_accounts uq_provider_uid; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_social_accounts
    ADD CONSTRAINT uq_provider_uid UNIQUE (provider, provider_uid);


--
-- Name: user_devices uq_user_device; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT uq_user_device UNIQUE (user_id, device_identifier);


--
-- Name: wishlists uq_user_event_wishlist; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT uq_user_event_wishlist UNIQUE (user_id, event_id);


--
-- Name: user_what_news uq_user_what_news; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_what_news
    ADD CONSTRAINT uq_user_what_news UNIQUE (user_id, what_news_id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_social_accounts user_social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_social_accounts
    ADD CONSTRAINT user_social_accounts_pkey PRIMARY KEY (id);


--
-- Name: user_what_news user_what_news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_what_news
    ADD CONSTRAINT user_what_news_pkey PRIMARY KEY (id);


--
-- Name: users_detail users_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_detail
    ADD CONSTRAINT users_detail_pkey PRIMARY KEY (id);


--
-- Name: users_detail users_detail_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_detail
    ADD CONSTRAINT users_detail_user_id_key UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: view_staff_events view_staff_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_staff_events
    ADD CONSTRAINT view_staff_events_pkey PRIMARY KEY (username);


--
-- Name: what_news what_news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.what_news
    ADD CONSTRAINT what_news_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_app_versions_platform_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_app_versions_platform_active ON public.app_versions USING btree (platform, is_active, version_code DESC);


--
-- Name: idx_assoc_physical_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assoc_physical_uid ON public.ticket_associations USING btree (physical_uid);


--
-- Name: idx_assoc_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assoc_ticket_id ON public.ticket_associations USING btree (ticket_id);


--
-- Name: idx_cities_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cities_is_active ON public.cities USING btree (is_active);


--
-- Name: idx_cities_province_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cities_province_id ON public.cities USING btree (province_id);


--
-- Name: idx_event_details_city_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_details_city_id ON public.event_details USING btree (city_id);


--
-- Name: idx_event_details_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_details_event_id ON public.event_details USING btree (event_id);


--
-- Name: idx_event_facilities_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_facilities_event_id ON public.event_facilities USING btree (event_id);


--
-- Name: idx_event_facilities_facility_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_facilities_facility_id ON public.event_facilities USING btree (facility_id);


--
-- Name: idx_event_photo_quotas_user_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_photo_quotas_user_event ON public.event_photo_quotas USING btree (user_id, event_id);


--
-- Name: idx_event_photos_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_photos_event_id ON public.event_photos USING btree (event_id);


--
-- Name: idx_event_photos_user_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_photos_user_event ON public.event_photos USING btree (user_id, event_id);


--
-- Name: idx_event_photos_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_photos_user_id ON public.event_photos USING btree (user_id);


--
-- Name: idx_event_social_media_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_social_media_event_id ON public.event_social_media USING btree (event_id);


--
-- Name: idx_event_views_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_views_event_id ON public.event_views USING btree (event_id);


--
-- Name: idx_event_views_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_views_user_id ON public.event_views USING btree (user_id);


--
-- Name: idx_event_views_viewed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_views_viewed_at ON public.event_views USING btree (viewed_at);


--
-- Name: idx_event_whatsapp_sessions_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_whatsapp_sessions_event_id ON public.event_whatsapp_sessions USING btree (event_id);


--
-- Name: idx_event_whatsapp_sessions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_whatsapp_sessions_status ON public.event_whatsapp_sessions USING btree (status);


--
-- Name: idx_order_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_date ON public.orders USING btree (date DESC);


--
-- Name: idx_promos_active_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promos_active_dates ON public.promos USING btree (active, start_date, end_date);


--
-- Name: idx_promos_event_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_promos_event_code ON public.promos USING btree (event_id, code);


--
-- Name: idx_provinces_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_provinces_is_active ON public.provinces USING btree (is_active);


--
-- Name: idx_rsvp_blast_batches_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rsvp_blast_batches_event_id ON public.rsvp_blast_batches USING btree (event_id);


--
-- Name: idx_rsvp_blast_contacts_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rsvp_blast_contacts_batch_id ON public.rsvp_blast_contacts USING btree (batch_id);


--
-- Name: idx_rsvp_blast_contacts_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rsvp_blast_contacts_event_id ON public.rsvp_blast_contacts USING btree (event_id);


--
-- Name: idx_rsvp_blast_contacts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rsvp_blast_contacts_status ON public.rsvp_blast_contacts USING btree (status);


--
-- Name: idx_rsvp_payment_proofs_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rsvp_payment_proofs_order_id ON public.rsvp_payment_proofs USING btree (order_id);


--
-- Name: idx_social_accounts_provider_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_social_accounts_provider_uid ON public.user_social_accounts USING btree (provider, provider_uid);


--
-- Name: idx_social_accounts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_social_accounts_user_id ON public.user_social_accounts USING btree (user_id);


--
-- Name: idx_sync_logs_changed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_logs_changed_at ON public.sync_logs USING btree (changed_at);


--
-- Name: idx_sync_logs_record_changed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_sync_logs_record_changed ON public.sync_logs USING btree (table_name, record_id, changed_at);


--
-- Name: idx_sync_logs_table_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_logs_table_record ON public.sync_logs USING btree (table_name, record_id);


--
-- Name: idx_sync_metadata_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_sync_metadata_event_id ON public.sync_metadata USING btree (event_id);


--
-- Name: idx_tickets_event_id_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_event_id_order_id ON public.tickets USING btree (event_id, order_id);


--
-- Name: idx_tickets_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_order_id ON public.tickets USING btree (order_id);


--
-- Name: idx_transactions_status_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_status_created_at ON public.transactions USING btree (transaction_status_id, created_at DESC);


--
-- Name: idx_user_devices_fcm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_devices_fcm ON public.user_devices USING btree (fcm_token);


--
-- Name: idx_user_devices_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_devices_user_id ON public.user_devices USING btree (user_id);


--
-- Name: idx_user_what_news_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_what_news_user_id ON public.user_what_news USING btree (user_id);


--
-- Name: idx_users_detail_city_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_detail_city_id ON public.users_detail USING btree (city_id);


--
-- Name: idx_users_detail_province_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_detail_province_id ON public.users_detail USING btree (province_id);


--
-- Name: idx_users_detail_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_detail_user_id ON public.users_detail USING btree (user_id);


--
-- Name: idx_what_news_active_platform; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_what_news_active_platform ON public.what_news USING btree (is_active, platform, sort_order);


--
-- Name: idx_what_news_schedule; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_what_news_schedule ON public.what_news USING btree (started_at, expired_at);


--
-- Name: idx_wishlists_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wishlists_event_id ON public.wishlists USING btree (event_id);


--
-- Name: idx_wishlists_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wishlists_user_id ON public.wishlists USING btree (user_id);


--
-- Name: view_event_detail _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.view_event_detail AS
 SELECT a.id AS event_id,
    a.approved AS event_approved,
    a.category AS event_category,
    a.city AS event_city,
    a.code AS event_code,
    a.contact_person AS event_contact_person,
    a.copy_data_setting AS event_copy_data_setting,
    a.description AS event_description,
    a.detail_image AS event_detail_image,
    a.end_date AS event_end_date,
    a.end_date_offset AS event_end_date_offset,
    a.location AS event_location,
    a.location_link AS event_location_link,
    a.name AS event_name,
    a.province AS event_province,
    a.slide_image AS event_slide_image,
    a.start_date AS event_start_date,
    a.start_date_offset AS event_start_date_offset,
    a.thumbnail_image AS event_thumbnail_image,
    a.terms_and_condition AS event_terms_and_condition,
    eo.username AS event_organizer,
    u.profile_image AS event_organizer_logo,
    es.id AS event_status_id,
    es.name AS event_status_name,
    count(et.*) AS event_talent_count,
        CASE
            WHEN (sum(tc.price) = 0) THEN true
            ELSE false
        END AS ticket_category_is_free,
    sum(tc.price) AS ticket_category_total_price,
    min(tc.price) AS ticket_category_smallest_price,
    max(tc.price) AS ticket_category_largest_price,
    string_agg(DISTINCT (ecf.name)::text, ','::text) AS event_custom_fields
   FROM ((((((public.events a
     JOIN public.event_organizers eo ON ((a.id = eo.event_id)))
     JOIN public.event_statuses es ON ((a.event_status_id = es.id)))
     JOIN public.ticket_categories tc ON ((a.id = tc.event_id)))
     LEFT JOIN public.event_talents et ON ((a.id = et.event_id)))
     LEFT JOIN public.event_custom_fields ecf ON ((a.id = ecf.event_id)))
     JOIN public.users u ON (((eo.username)::text = (u.username)::text)))
  GROUP BY a.id, eo.id, es.id, u.id;


--
-- Name: view_transaction_details _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.view_transaction_details AS
 SELECT a.id AS transaction_id,
    a.amount AS transaction_amount,
    a.source AS transaction_source,
    a.transaction_status_id,
    h.name AS transaction_status_name,
    to_char(a.date, 'YYYY-MM-DD'::text) AS transaction_date,
    b.id AS order_id,
    b.order_status_id,
    f.name AS order_status_name,
    b.total_amount AS order_total_amount,
    b.admin_fees AS order_admin_fee,
    to_char(b.date, 'YYYY-MM-DD'::text) AS order_date,
    b.customer_id AS order_customer_id,
    c.ticket_category_id,
    d.name AS ticket_category_name,
    d.ticket_category_status_id,
    g.name AS ticket_category_status_name,
    e.id AS event_id,
    e.name AS event_name,
    i.id AS event_status_id,
    i.name AS event_status_name
   FROM ((((((((public.transactions a
     JOIN public.orders b ON (((a.order_id)::text = (b.id)::text)))
     JOIN public.tickets c ON (((a.order_id)::text = (c.order_id)::text)))
     JOIN public.ticket_categories d ON ((c.ticket_category_id = d.id)))
     JOIN public.events e ON ((d.event_id = e.id)))
     JOIN public.order_statuses f ON ((b.order_status_id = f.id)))
     JOIN public.ticket_category_statuses g ON ((d.ticket_category_status_id = g.id)))
     JOIN public.transaction_statuses h ON ((a.transaction_status_id = h.id)))
     JOIN public.event_statuses i ON ((e.event_status_id = i.id)))
  GROUP BY a.id, b.id, c.order_id, c.ticket_category_id, d.id, e.id, f.id, g.name, h.name, i.id;


--
-- Name: app_versions trg_app_versions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_app_versions_updated_at BEFORE UPDATE ON public.app_versions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_details trg_event_details_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_event_details_updated_at BEFORE UPDATE ON public.event_details FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_photo_quotas trg_event_photo_quotas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_event_photo_quotas_updated_at BEFORE UPDATE ON public.event_photo_quotas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_views trg_event_view_counts; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_event_view_counts AFTER INSERT ON public.event_views FOR EACH ROW EXECUTE FUNCTION public.update_event_view_counts();


--
-- Name: facilities trg_facilities_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_facilities_updated_at BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: user_social_accounts trg_social_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_social_accounts_updated_at BEFORE UPDATE ON public.user_social_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: orders trg_sync_orders; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_orders AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.create_sync_log_entry();


--
-- Name: ticket_categories trg_sync_ticket_categories; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_ticket_categories AFTER INSERT OR DELETE OR UPDATE ON public.ticket_categories FOR EACH ROW EXECUTE FUNCTION public.create_sync_log_entry();


--
-- Name: ticket_custom_fields trg_sync_ticket_custom_fields; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_ticket_custom_fields AFTER INSERT OR DELETE OR UPDATE ON public.ticket_custom_fields FOR EACH ROW EXECUTE FUNCTION public.create_sync_log_entry();


--
-- Name: ticket_verification trg_sync_ticket_verification; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_ticket_verification AFTER INSERT OR DELETE OR UPDATE ON public.ticket_verification FOR EACH ROW EXECUTE FUNCTION public.create_sync_log_entry();


--
-- Name: tickets trg_sync_tickets; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_tickets AFTER INSERT OR DELETE OR UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.create_sync_log_entry();


--
-- Name: transactions trg_sync_transactions; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_transactions AFTER INSERT OR DELETE OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.create_sync_log_entry();


--
-- Name: user_devices trg_user_devices_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_user_devices_updated_at BEFORE UPDATE ON public.user_devices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users_detail trg_users_detail_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_detail_updated_at BEFORE UPDATE ON public.users_detail FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: what_news trg_what_news_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_what_news_updated_at BEFORE UPDATE ON public.what_news FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: wishlists trg_wishlists_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_wishlists_updated_at BEFORE UPDATE ON public.wishlists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_staffs event_staffs_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_staffs
    ADD CONSTRAINT event_staffs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_staffs event_staffs_staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_staffs
    ADD CONSTRAINT event_staffs_staff_user_id_fkey FOREIGN KEY (staff_user_id) REFERENCES public.users(id);


--
-- Name: event_whatsapp_sessions event_whatsapp_sessions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_whatsapp_sessions
    ADD CONSTRAINT event_whatsapp_sessions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_organizers fk16stg4khqay3j62bjnxp8rgdb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_organizers
    ADD CONSTRAINT fk16stg4khqay3j62bjnxp8rgdb FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: ticket_categories fk1gvdrrce3gao9i4m6rb0xbw4x; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_categories
    ADD CONSTRAINT fk1gvdrrce3gao9i4m6rb0xbw4x FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: events fk2fr6bmov203s0p1p86kkj56j2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk2fr6bmov203s0p1p86kkj56j2 FOREIGN KEY (event_status_id) REFERENCES public.event_statuses(id);


--
-- Name: tickets fk3utafe14rupaypjocldjaj4ol; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk3utafe14rupaypjocldjaj4ol FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_talents fk4ty0iqyd6a2lgjp5pq1gjp39w; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_talents
    ADD CONSTRAINT fk4ty0iqyd6a2lgjp5pq1gjp39w FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: ticket_custom_fields fk9fx2wnog6rkbrddlq50i1o27i; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_custom_fields
    ADD CONSTRAINT fk9fx2wnog6rkbrddlq50i1o27i FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: cities fk_cities_province; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT fk_cities_province FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE RESTRICT;


--
-- Name: event_carousels fk_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_carousels
    ADD CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_details fk_event_details_city; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_details
    ADD CONSTRAINT fk_event_details_city FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: event_details fk_event_details_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_details
    ADD CONSTRAINT fk_event_details_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_facilities fk_event_facilities_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_facilities
    ADD CONSTRAINT fk_event_facilities_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_facilities fk_event_facilities_facility; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_facilities
    ADD CONSTRAINT fk_event_facilities_facility FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE;


--
-- Name: event_photo_quotas fk_event_photo_quotas_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_photo_quotas
    ADD CONSTRAINT fk_event_photo_quotas_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_photo_quotas fk_event_photo_quotas_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_photo_quotas
    ADD CONSTRAINT fk_event_photo_quotas_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: event_photos fk_event_photos_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_photos
    ADD CONSTRAINT fk_event_photos_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_photos fk_event_photos_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_photos
    ADD CONSTRAINT fk_event_photos_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: event_social_media fk_event_social_media_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_social_media
    ADD CONSTRAINT fk_event_social_media_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_staff_permissions fk_event_staff_permissions_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_staff_permissions
    ADD CONSTRAINT fk_event_staff_permissions_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_staff_permissions fk_event_staff_permissions_staff; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_staff_permissions
    ADD CONSTRAINT fk_event_staff_permissions_staff FOREIGN KEY (staff_id) REFERENCES public.event_staffs(id) ON DELETE CASCADE;


--
-- Name: event_view_counts fk_event_view_counts_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_view_counts
    ADD CONSTRAINT fk_event_view_counts_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_views fk_event_views_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_views
    ADD CONSTRAINT fk_event_views_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: orders fk_orders_promo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_promo FOREIGN KEY (promo_id) REFERENCES public.promos(id);


--
-- Name: promos fk_promos_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promos
    ADD CONSTRAINT fk_promos_event FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: rsvp_blast_batches fk_rsvp_blast_batches_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsvp_blast_batches
    ADD CONSTRAINT fk_rsvp_blast_batches_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: rsvp_blast_contacts fk_rsvp_blast_contacts_batch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsvp_blast_contacts
    ADD CONSTRAINT fk_rsvp_blast_contacts_batch FOREIGN KEY (batch_id) REFERENCES public.rsvp_blast_batches(id) ON DELETE CASCADE;


--
-- Name: rsvp_blast_contacts fk_rsvp_blast_contacts_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsvp_blast_contacts
    ADD CONSTRAINT fk_rsvp_blast_contacts_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: rsvp_payment_proofs fk_rsvp_payment_proofs_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rsvp_payment_proofs
    ADD CONSTRAINT fk_rsvp_payment_proofs_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: user_social_accounts fk_social_accounts_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_social_accounts
    ADD CONSTRAINT fk_social_accounts_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ticket_associations fk_ticket; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_associations
    ADD CONSTRAINT fk_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: user_devices fk_user_devices_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT fk_user_devices_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_what_news fk_user_what_news_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_what_news
    ADD CONSTRAINT fk_user_what_news_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_what_news fk_user_what_news_what_news; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_what_news
    ADD CONSTRAINT fk_user_what_news_what_news FOREIGN KEY (what_news_id) REFERENCES public.what_news(id) ON DELETE CASCADE;


--
-- Name: users_detail fk_users_detail_city; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_detail
    ADD CONSTRAINT fk_users_detail_city FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: users_detail fk_users_detail_province; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_detail
    ADD CONSTRAINT fk_users_detail_province FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE SET NULL;


--
-- Name: users_detail fk_users_detail_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_detail
    ADD CONSTRAINT fk_users_detail_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: what_news fk_what_news_app_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.what_news
    ADD CONSTRAINT fk_what_news_app_version FOREIGN KEY (app_version_id) REFERENCES public.app_versions(id) ON DELETE SET NULL;


--
-- Name: wishlists fk_wishlists_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: orders fkcbbqf26brulgfgvd0mf74rv4y; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fkcbbqf26brulgfgvd0mf74rv4y FOREIGN KEY (order_status_id) REFERENCES public.order_statuses(id);


--
-- Name: transactions fkgxn8h1b4mxtuo0uwxy2m819p; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fkgxn8h1b4mxtuo0uwxy2m819p FOREIGN KEY (transaction_status_id) REFERENCES public.transaction_statuses(id);


--
-- Name: event_custom_fields fkkhhpca831k87trdspy0fcrgf2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_custom_fields
    ADD CONSTRAINT fkkhhpca831k87trdspy0fcrgf2 FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: tickets fkkrqxfo3bygn170i2mdsbt1of1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fkkrqxfo3bygn170i2mdsbt1of1 FOREIGN KEY (ticket_category_id) REFERENCES public.ticket_categories(id);


--
-- Name: tickets fkqgi3sbv1u45s41wawh75ut8ph; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fkqgi3sbv1u45s41wawh75ut8ph FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: ticket_categories fkrs7jd8co0cs6x7hs47d0lslc4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_categories
    ADD CONSTRAINT fkrs7jd8co0cs6x7hs47d0lslc4 FOREIGN KEY (ticket_category_status_id) REFERENCES public.ticket_category_statuses(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO kartjis_app;


--
-- Name: TABLE app_versions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.app_versions TO kartjis_app;


--
-- Name: TABLE authorizations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.authorizations TO kartjis_app;


--
-- Name: TABLE cities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.cities TO kartjis_app;


--
-- Name: TABLE event_carousels; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_carousels TO kartjis_app;


--
-- Name: TABLE event_categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_categories TO kartjis_app;


--
-- Name: TABLE event_custom_fields; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_custom_fields TO kartjis_app;


--
-- Name: TABLE event_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_details TO kartjis_app;


--
-- Name: TABLE event_facilities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_facilities TO kartjis_app;


--
-- Name: TABLE event_gates; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_gates TO kartjis_app;


--
-- Name: TABLE event_organizers; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_organizers TO kartjis_app;


--
-- Name: TABLE event_photo_quotas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_photo_quotas TO kartjis_app;


--
-- Name: TABLE event_photos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_photos TO kartjis_app;


--
-- Name: TABLE event_social_media; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_social_media TO kartjis_app;


--
-- Name: TABLE event_staff_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_staff_permissions TO kartjis_app;


--
-- Name: TABLE event_staffs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_staffs TO kartjis_app;


--
-- Name: TABLE event_statuses; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_statuses TO kartjis_app;


--
-- Name: TABLE event_talents; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_talents TO kartjis_app;


--
-- Name: TABLE event_view_counts; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_view_counts TO kartjis_app;


--
-- Name: TABLE event_views; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_views TO kartjis_app;


--
-- Name: TABLE event_whatsapp_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_whatsapp_sessions TO kartjis_app;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.events TO kartjis_app;


--
-- Name: TABLE facilities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.facilities TO kartjis_app;


--
-- Name: TABLE fees; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fees TO kartjis_app;


--
-- Name: TABLE general_option; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.general_option TO kartjis_app;


--
-- Name: TABLE http_request_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.http_request_records TO kartjis_app;


--
-- Name: TABLE kafka_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.kafka_messages TO kartjis_app;


--
-- Name: TABLE order_helper; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.order_helper TO kartjis_app;


--
-- Name: TABLE order_statuses; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.order_statuses TO kartjis_app;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.orders TO kartjis_app;


--
-- Name: TABLE otp_verifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.otp_verifications TO kartjis_app;


--
-- Name: TABLE password_reset_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.password_reset_tokens TO kartjis_app;


--
-- Name: TABLE promos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.promos TO kartjis_app;


--
-- Name: TABLE provinces; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.provinces TO kartjis_app;


--
-- Name: TABLE rsvp_blast_batches; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.rsvp_blast_batches TO kartjis_app;


--
-- Name: TABLE rsvp_blast_contacts; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.rsvp_blast_contacts TO kartjis_app;


--
-- Name: TABLE rsvp_payment_proofs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.rsvp_payment_proofs TO kartjis_app;


--
-- Name: TABLE sync_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sync_logs TO kartjis_app;


--
-- Name: SEQUENCE sync_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.sync_logs_id_seq TO kartjis_app;


--
-- Name: TABLE sync_metadata; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sync_metadata TO kartjis_app;


--
-- Name: SEQUENCE sync_metadata_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.sync_metadata_id_seq TO kartjis_app;


--
-- Name: TABLE ticket_associations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ticket_associations TO kartjis_app;


--
-- Name: TABLE ticket_categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ticket_categories TO kartjis_app;


--
-- Name: TABLE ticket_category_statuses; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ticket_category_statuses TO kartjis_app;


--
-- Name: TABLE ticket_custom_fields; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ticket_custom_fields TO kartjis_app;


--
-- Name: TABLE ticket_verification; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ticket_verification TO kartjis_app;


--
-- Name: TABLE tickets; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tickets TO kartjis_app;


--
-- Name: TABLE transaction_statuses; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.transaction_statuses TO kartjis_app;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.transactions TO kartjis_app;


--
-- Name: TABLE user_devices; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_devices TO kartjis_app;


--
-- Name: SEQUENCE user_devices_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_devices_id_seq TO kartjis_app;


--
-- Name: TABLE user_social_accounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_social_accounts TO kartjis_app;


--
-- Name: TABLE user_what_news; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_what_news TO kartjis_app;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO kartjis_app;


--
-- Name: TABLE users_detail; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users_detail TO kartjis_app;


--
-- Name: SEQUENCE users_detail_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_detail_id_seq TO kartjis_app;


--
-- Name: TABLE view_event_detail; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.view_event_detail TO kartjis_app;


--
-- Name: TABLE view_staff_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.view_staff_events TO kartjis_app;


--
-- Name: TABLE view_ticket_detail; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.view_ticket_detail TO kartjis_app;


--
-- Name: TABLE view_ticket_category_stock; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.view_ticket_category_stock TO kartjis_app;


--
-- Name: TABLE view_ticket_category_stock_daily; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.view_ticket_category_stock_daily TO kartjis_app;


--
-- Name: TABLE view_ticket_detail_v2; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.view_ticket_detail_v2 TO kartjis_app;


--
-- Name: TABLE view_transaction_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.view_transaction_details TO kartjis_app;


--
-- Name: TABLE view_transaction_details_v2; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.view_transaction_details_v2 TO kartjis_app;


--
-- Name: TABLE what_news; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.what_news TO kartjis_app;


--
-- Name: TABLE wishlists; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.wishlists TO kartjis_app;


--
-- Name: SEQUENCE wishlists_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wishlists_id_seq TO kartjis_app;


--
-- Name: TABLE withdrawals; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.withdrawals TO kartjis_app;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO kartjis_app;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO kartjis_app;


--
-- PostgreSQL database dump complete
--

\unrestrict tD7DetRNZycXnbZPXykFqkSsopeo2YVsfxYkHPsmdJH7u6Gde53axS9FmYY12vg

