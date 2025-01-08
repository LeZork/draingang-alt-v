if (window.alt === undefined) {
    window.alt = {
      emit: () => { },
      on: () => { },
    };
}

/**
 * Attaches an event listener to the element with id 'yes'.
 * Emits the 'rent:confirm' event with a value of true when the element is clicked,
 * indicating confirmation of the rent action.
 */

 document.getElementById('yes').onclick = function() {
    alt.emit('rent:confirm', true);
};
        

/**
 * Attaches an event listener to the element with id 'no'.
 * Emits the 'rent:confirm' event with a value of false when the element is clicked,
 * indicating cancellation of the rent action.
 */

document.getElementById('no').onclick = function() {
    alt.emit('rent:confirm', false);
};
