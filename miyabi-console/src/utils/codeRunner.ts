import React from 'react';
import * as LucideReact from 'lucide-react';
import * as Recharts from 'recharts';

// Ensure window.Babel is typed
declare global {
  interface Window {
    Babel: any;
  }
}

// This function takes raw string code, transpiles it using Babel Standalone, 
// and executes it within a sandboxed environment using a custom require shim.
export const executeCode = (code: string, scope: Record<string, any> = {}) => {
  // Check if Babel is available
  if (!window.Babel) {
    console.error("Babel Standalone is not loaded.");
    throw new Error("Babel compiler is missing. Please check your internet connection or index.html scripts.");
  }

  try {
    // 1. Transpile JSX/TSX to JS using the global Babel instance.
    // We use 'runtime: classic' to compile JSX to React.createElement instead of jsx-runtime
    // because we are injecting 'React' manually and don't want to handle the /jsx-runtime subpath.
    const result = window.Babel.transform(code, {
      presets: [
        ['env', { modules: 'commonjs' }],
        ['react', { runtime: 'classic' }],
        'typescript'
      ],
      filename: 'dynamic.tsx',
    });

    if (!result || !result.code) {
      throw new Error("Babel transform returned empty code.");
    }

    // 2. Prepare the module system shims
    const exports: Record<string, any> = {};
    const module = { exports };

    const customRequire = (moduleName: string) => {
      if (moduleName === 'react') return React;
      if (moduleName === 'lucide-react') return LucideReact;
      if (moduleName === 'recharts') return Recharts;
      // Allow specific injected scope items if matched by name
      if (scope && scope[moduleName]) return scope[moduleName];
      
      console.warn(`Module '${moduleName}' not found in sandbox.`);
      return null;
    };

    // 3. Create the component factory
    // 'result.code' contains the transpiled CommonJS code.
    // We wrap it in a function to simulate the module scope.
    const componentFactory = new Function('require', 'module', 'exports', 'React', result.code);

    // 4. Execute the factory
    componentFactory(customRequire, module, exports, React);

    // 5. Extract the default export
    const Component = module.exports.default || module.exports;

    if (!Component) {
      throw new Error("The generated code must export a default component.");
    }

    return Component;
  } catch (error) {
    console.error("Runtime Execution Error:", error);
    if (error instanceof SyntaxError) {
      throw new Error(`Syntax Error in generated code: ${error.message}`);
    }
    throw error;
  }
};