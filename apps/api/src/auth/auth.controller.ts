import { Body, Controller, Get, Post, Req, Res, UseGuards, UsePipes } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginRequest, type LoginResponse, type AgentProfile } from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import { SessionService, SESSION_COOKIE, SESSION_TTL_MENIT } from './session.service.js';
import { PermissionGuard } from './permission.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly session: SessionService,
  ) {}

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginRequest))
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const { agent, sessionId } = await this.auth.login(body.email, body.password);

    // httpOnly: tidak bisa dibaca JavaScript, jadi kebal pencurian lewat XSS.
    // sameSite lax: cukup untuk aplikasi internal, tetap menahan CSRF dasar.
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // di produksi (HTTPS) ubah jadi true
      maxAge: SESSION_TTL_MENIT * 60_000,
      path: '/',
    });

    return { agent };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const id = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (id) await this.session.destroy(id);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(PermissionGuard)
  me(@Req() req: Request): { agent: AgentProfile } {
    return { agent: (req as Request & { agent: AgentProfile }).agent };
  }
}
