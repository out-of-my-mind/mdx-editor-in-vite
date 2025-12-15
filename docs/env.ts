import { loadEnv } from 'vite';
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

export default env