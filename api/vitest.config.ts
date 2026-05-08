import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
      include: ['**/*.test.ts'], // Solo incluye los tests del directorio API
      fileParallelism: false,
      setupFiles: ['./tests/utils/setup.ts'],
      globals: true, // Habilita la API global de Vitest
      environment: 'node', // Usa el entorno Node.js
      typecheck: {
        tsconfig: 'tsconfig.json', // Asegura que Vitest utilice el tsconfig específico
      },
    },
  });
