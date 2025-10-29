-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.conversations (
  id text NOT NULL DEFAULT gen_random_uuid(),
  userId text NOT NULL,
  title text NOT NULL,
  createdAt timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages (
  id text NOT NULL DEFAULT gen_random_uuid(),
  conversationId text NOT NULL,
  role USER-DEFINED NOT NULL,
  content text NOT NULL,
  citations jsonb DEFAULT '[]'::jsonb,
  createdAt timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversationId_fkey FOREIGN KEY (conversationId) REFERENCES public.conversations(id)
);
CREATE TABLE public.videos (
  id text NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  userId text NOT NULL,
  youtubeId text NOT NULL,
  title text,
  thumbnailUrl text,
  channelName text,
  duration integer,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::"VideoStatus",
  error text,
  createdAt timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp with time zone,
  zeroentropyCollectionId text,
  CONSTRAINT videos_pkey PRIMARY KEY (id)
);