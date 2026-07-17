import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'dadai:isPublic';

/** Marks a route as reachable without authentication (health, webhooks). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
