// src/app/shared/services/jwt.service.ts
import { Injectable } from '@angular/core';

export interface JwtPayload {
  typ: string;
  exp: number;
  iat: number;
  uid: number;
  user_type?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  /**
   * Decodes a JWT token and returns the payload
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      // JWT has 3 parts: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format');
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      // Replace URL-safe characters and pad if necessary
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

      // Decode base64
      const jsonPayload = atob(padded);
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Checks if a token is expired
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate < new Date();
  }

  /**
   * Gets the expiration date of a token
   */
  getTokenExpirationDate(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  }

  /**
   * Gets user info from token
   */
  getUserFromToken(token: string): Partial<JwtPayload> | null {
    const payload = this.decodeToken(token);
    if (!payload) {
      return null;
    }

    return {
      uid: payload.uid,
      user_type: payload.user_type,
      username: payload.username,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      full_name: payload.full_name,
      avatar: payload.avatar
    };
  }

  /**
   * Gets remaining time until token expiration in milliseconds
   */
  getTokenRemainingTime(token: string): number {
    const expirationDate = this.getTokenExpirationDate(token);
    if (!expirationDate) {
      return 0;
    }

    return Math.max(0, expirationDate.getTime() - new Date().getTime());
  }
}
