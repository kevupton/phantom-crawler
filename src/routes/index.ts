
import { Express } from 'express';

export function loadRoutes (app : Express) {
  app.get('test', (req, res) => {
    res.send('Hello World!');
  });
}
