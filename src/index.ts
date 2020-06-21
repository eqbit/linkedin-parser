import { Main } from './services/main';

const main = new Main();

main.init().then(() => {
  main.openPage();
});

// const main = () => {
//   setTimeout(() => {
//     const skills = document.querySelectorAll('.pv-skill-categories-section .pv-skill-categories-section__top-skills li button');
//     const form = document.querySelector('.pv-endorsement-followup__form');
//     const input = form.querySelector('#endorsement-followup-proficiency-1-HTML');
//     const submitBtn = document.querySelector('.pv-endorsement-followup__footer > button')
//   })
// };
//
// console.log('start')
