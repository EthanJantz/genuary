import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        day1: "1/index.html",
        day2: "2/index.html",
        day3: "3/index.html",
        day4: "4/index.html",
        day5: "5/index.html",
        day6: "6/index.html",
        day7: "7/index.html",
      },
    },
  },
});
