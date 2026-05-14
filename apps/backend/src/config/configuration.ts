export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  corsOrigin: string;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    sync: boolean;
  };
}

export const configuration = (): AppConfig => ({
  nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'durak',
    password: process.env.DB_PASSWORD ?? 'durak',
    database: process.env.DB_NAME ?? 'durak',
    sync: process.env.DB_SYNC === 'true',
  },
});
