import { Request, Response } from 'express';
import { AuthService } from '@services/user';

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response) => {
    const data = await this.authService.signup(req.body);
    res.status(200).json(data);
  };
}

export default new AuthController();
