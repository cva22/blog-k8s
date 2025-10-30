// Event Types for RabbitMQ Communication
export interface BaseEvent {
  id: string;
  timestamp: Date;
  source: string;
  version: string;
}

// Auth Service Events
export interface UserRegisteredEvent extends BaseEvent {
  type: 'user.registered';
  data: {
    userId: string;
    email: string;
    username: string;
  };
}

export interface UserLoggedInEvent extends BaseEvent {
  type: 'user.logged_in';
  data: {
    userId: string;
    email: string;
    sessionId: string;
  };
}

export interface UserLoggedOutEvent extends BaseEvent {
  type: 'user.logged_out';
  data: {
    userId: string;
    sessionId: string;
  };
}

// Posts Service Events
export interface PostCreatedEvent extends BaseEvent {
  type: 'post.created';
  data: {
    postId: string;
    title: string;
    content: string;
    authorId: string;
    published: boolean;
  };
}

export interface PostUpdatedEvent extends BaseEvent {
  type: 'post.updated';
  data: {
    postId: string;
    title?: string;
    content?: string;
    published?: boolean;
    authorId: string;
  };
}

export interface PostDeletedEvent extends BaseEvent {
  type: 'post.deleted';
  data: {
    postId: string;
    authorId: string;
  };
}

export interface PostPublishedEvent extends BaseEvent {
  type: 'post.published';
  data: {
    postId: string;
    title: string;
    authorId: string;
  };
}

// Comments Service Events
export interface CommentCreatedEvent extends BaseEvent {
  type: 'comment.created';
  data: {
    commentId: string;
    postId: string;
    content: string;
    authorId: string;
  };
}

export interface CommentUpdatedEvent extends BaseEvent {
  type: 'comment.updated';
  data: {
    commentId: string;
    postId: string;
    content: string;
    authorId: string;
  };
}

export interface CommentDeletedEvent extends BaseEvent {
  type: 'comment.deleted';
  data: {
    commentId: string;
    postId: string;
    authorId: string;
  };
}

// Moderation Service Events
export interface ContentFlaggedEvent extends BaseEvent {
  type: 'content.flagged';
  data: {
    contentId: string;
    contentType: 'post' | 'comment';
    reason: string;
    flaggedBy: string;
  };
}

export interface ContentApprovedEvent extends BaseEvent {
  type: 'content.approved';
  data: {
    contentId: string;
    contentType: 'post' | 'comment';
    moderatorId: string;
  };
}

export interface ContentRejectedEvent extends BaseEvent {
  type: 'content.rejected';
  data: {
    contentId: string;
    contentType: 'post' | 'comment';
    reason: string;
    moderatorId: string;
  };
}

// Query Service Events (for cache invalidation)
export interface CacheInvalidatedEvent extends BaseEvent {
  type: 'cache.invalidated';
  data: {
    cacheKey: string;
    reason: string;
  };
}

// Union type for all events
export type BlogEvent = 
  | UserRegisteredEvent
  | UserLoggedInEvent
  | UserLoggedOutEvent
  | PostCreatedEvent
  | PostUpdatedEvent
  | PostDeletedEvent
  | PostPublishedEvent
  | CommentCreatedEvent
  | CommentUpdatedEvent
  | CommentDeletedEvent
  | ContentFlaggedEvent
  | ContentApprovedEvent
  | ContentRejectedEvent
  | CacheInvalidatedEvent;

// Event routing configuration
export const EVENT_ROUTING = {
  'user.registered': ['posts', 'comments', 'moderation'],
  'user.logged_in': ['posts', 'comments'],
  'user.logged_out': ['posts', 'comments'],
  'post.created': ['comments', 'moderation', 'query'],
  'post.updated': ['comments', 'moderation', 'query'],
  'post.deleted': ['comments', 'moderation', 'query'],
  'post.published': ['comments', 'moderation', 'query'],
  'comment.created': ['posts', 'moderation', 'query'],
  'comment.updated': ['posts', 'moderation', 'query'],
  'comment.deleted': ['posts', 'moderation', 'query'],
  'content.flagged': ['posts', 'comments', 'query'],
  'content.approved': ['posts', 'comments', 'query'],
  'content.rejected': ['posts', 'comments', 'query'],
  'cache.invalidated': ['query'],
} as const;
