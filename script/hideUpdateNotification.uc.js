(function () {
  // Select the node that will be observed for mutations
  const targetNode = document.getElementById('appMenu-notification-popup');

  const updateNode = document.getElementById('appMenu-update-available-notification');

  // Options for the observer (which mutations to observe)
  const config = {
    attributes: true,
    attributeFilter: ['hidden'],
    // subtree: true
  };

  // Callback function to execute when mutations are observed
  const mCallback = function (mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    for (let mutation of mutationsList) {
      if (mutation.type === 'attributes' || 'subtree') {
        if (updateNode.getAttribute('hidden') == 'true') {
          try {
            targetNode.removeAttribute('hidden');
            // console.log('update popup hidden -> appMenu popup visible');
          } catch (e) {};
        } else {
          try {
            targetNode.setAttribute('hidden', 'true');
            // console.log('update popup visible -> appMenu popup hidden');
          } catch (e) {};
        }
      }
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(mCallback);

  // Start observing the target node for configured mutations
  observer.observe(updateNode, config);
})();