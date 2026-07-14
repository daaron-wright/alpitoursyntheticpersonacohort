import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
// NOTE: Only HTML files that have been migrated to Vite ESM are included.
// Legacy CDN/Babel HTML files are kept in the repo but not built by Vite —
// they continue to be served as static files. Add them here as they are migrated.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  css: {
    // Inline small assets; don't inline large external CSS
    preprocessorOptions: {},
  },
  build: {
    rollupOptions: {
      input: {
        // Root — guided demo (served at /)
        'index': resolve(__dirname, 'index.html'),
        // Guided demo (also reachable by filename)
        'guided-demo': resolve(__dirname, 'AlpiGPT 2.0 - Guided Demo.html'),
        // Synthetic Cohort — separate deployment
        'cohort': resolve(__dirname, 'Travel Group Synthetic Cohort.html'),
        // Additional migrated apps will be added here as they are completed:
        // 'storefront': resolve(__dirname, 'EasyBook Next - B2B Storefront.html'),
        // 'easybook': resolve(__dirname, 'EasyBook Next - AlpiGPT Workbench.html'),
        // 'platform': resolve(__dirname, 'Alpitour Platform.html'),
        // 'cohort': resolve(__dirname, 'Travel Group Synthetic Cohort.html'),
        // 'frontdoor': resolve(__dirname, 'Alpitour.it - AlpiGPT Front Door.html'),
        // 'frontdoor-simple': resolve(__dirname, 'Alpitour.it - Customer Front Door (Simple).html'),
        // 'concierge': resolve(__dirname, 'AlpiGPT B2B Concierge PoC.html'),
        // 'concierge-v2': resolve(__dirname, 'AlpiGPT B2B Concierge v2.html'),
        // 'spine': resolve(__dirname, 'Alpitour Operations on KAF.html'),
        // 'dow-spine': resolve(__dirname, 'Dow Supply Chain on KAF.html'),
        // 'dow': resolve(__dirname, 'Dow.com Customer Experience.html'),
        // 'dow-o2c': resolve(__dirname, 'Dow Sample-to-Ship Orchestration.html'),
        // 'proposal': resolve(__dirname, 'Bianchi Proposal - Customer View.html'),
        // 'proposal-v1': resolve(__dirname, 'Bianchi Proposal - Customer View v1.html'),
        // 'deck': resolve(__dirname, 'Alpitour AlpiGPT 2.0 - Deck.html'),
        // 'flows': resolve(__dirname, 'Alpitour AlpiGPT 2.0 - Flows & Agentic Inventory.html'),
      },
    },
  },
});
