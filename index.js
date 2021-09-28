(async () => {
  await new Promise((resolve) =>
    setTimeout(() => {
      console.log(process.argv);
      resolve();
    }, 5500))
})();
