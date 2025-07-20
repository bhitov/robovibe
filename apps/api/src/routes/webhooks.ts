/**
 * Clerk webhook handlers for user synchronization
 * Syncs user data from Clerk to our database
 */

import express, { Request, Response } from 'express';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/clerk-sdk-node';
import { db, users, insertUserSchema } from '@repo/db';
import { eq } from 'drizzle-orm';
import { serverConfig } from '@repo/config';

const router = express.Router();

// Clerk webhook endpoint
router.post('/clerk', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    // Get the webhook secret from config
    const WEBHOOK_SECRET = serverConfig.clerk.webhookSecret;
    
    if (!WEBHOOK_SECRET) {
      throw new Error('Missing CLERK_WEBHOOK_SECRET in configuration');
    }

    // Get the headers
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: 'Error occurred -- no svix headers' });
    }

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the webhook
    try {
      evt = wh.verify(req.body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return res.status(400).json({ error: 'Error occurred during verification' });
    }

    // Handle the webhook events
    const eventType = evt.type;

    console.log(`Webhook event of type ${eventType}`);

    // Handle user created event
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id: clerkUserId, email_addresses, username, first_name, last_name, image_url } = evt.data;
      
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        console.error('No primary email found for user');
        return res.status(400).json({ error: 'No primary email found' });
      }

      const userData = {
        clerkUserId,
        email: primaryEmail.email_address,
        username: username || null,
        firstName: first_name || null,
        lastName: last_name || null,
        imageUrl: image_url || null,
        metadata: evt.data.public_metadata || {},
        lastSignInAt: evt.data.last_sign_in_at ? new Date(evt.data.last_sign_in_at) : null,
      };

      // Validate the data
      const validatedData = insertUserSchema.parse(userData);

      // Upsert user in database
      await db
        .insert(users)
        .values(validatedData)
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: {
            ...validatedData,
            updatedAt: new Date(),
          },
        });

      console.log(`User ${clerkUserId} synced to database`);
    }

    // Handle user deleted event
    if (eventType === 'user.deleted') {
      const clerkUserId = evt.data.id;
      
      if (!clerkUserId) {
        console.error('No user ID found in delete event');
        return res.status(400).json({ error: 'No user ID found' });
      }
      
      // Soft delete or handle as needed
      await db
        .delete(users)
        .where(eq(users.clerkUserId, clerkUserId));
      
      console.log(`User ${clerkUserId} deleted from database`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export default router;