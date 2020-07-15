const markdown = require('markdown-it')({
  html: true
})

/**
 * Add a notes property to the slide templates objects.
 * @param {object[]} slides
 * @param {object[]} notes
 */
function linkSlidesWithNotes(slides, notes) {
  const notesBySlug = notes.reduce((acc, note) => {
    const slug = note.fileSlug.split(".")[0];
    acc[slug] = note;
    return acc;
  }, {});

  slides.forEach((slide) => {
    slide.notes = notesBySlug[slide.fileSlug];
  });
}

module.exports = function (config) {
  config.addNunjucksFilter("noteSlug", (value) => {
    return value.fileSlug.split(".")[0];
  });

  config.addCollection("slides", (collection) => {
    const unorderedSlides = collection.getFilteredByGlob(
      "./src/slides/!(*.notes.md)"
    );

    // If some slides don't have the `order` key.
    const slidesWithoutOrder = unorderedSlides.filter((s) => !s.data.order);

    if (slidesWithoutOrder.length) {
      slidesWithoutOrder.forEach((s) => {
        console.log(`⚠️ Slide "${s.fileSlug}" has no order`);
      });
      return unorderedSlides;
    }

    // If some slides have the same `order` key
    const orders = unorderedSlides.map((s) => s.data.order);
    const uniqueOrders = [...new Set(orders)];

    if (orders.length != uniqueOrders.length) {
      console.log(`⚠️ Some slides have a duplicate order!`);
      return unorderedSlides;
    }

    const orderedSlides = unorderedSlides.sort((a, b) => {
      return a.data.order > b.data.order ? 1 : -1;
    });

    const notes = collection.getFilteredByGlob("./src/slides/*.notes.md");
    linkSlidesWithNotes(orderedSlides, notes);

    return orderedSlides;
  });

  config.addPassthroughCopy("src/styles");
  config.addPassthroughCopy("src/scripts");

  config.setBrowserSyncConfig({
    notify: true,
  });

  return {
    passthroughFileCopy: true,
    dir: {
      input: "src",
      output: "dist",
    },
  };
};
