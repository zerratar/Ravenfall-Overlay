import { SubView } from "./BaseViews.js";


export class TrainingView extends SubView {
    constructor(parentView) {
        super(parentView, 'training');

        this.characterStats = document.querySelector('.character-stats');
        // todo(zerratar): replace to use actual <template></template>
        this.characterStatsTemplate = document.querySelector('.character-stat').outerHTML;
        this.characterStats.innerHTML = '';
        this.activeTaskBtn = null;
    }

    onCharacterUpdated(character) {

        this.characterStats.innerHTML = '';
        const currentSkill = Ravenfall.getCurrentSkill();
        const props = Object.keys(character.skills);

        for (let prop of props) {
            if (prop.indexOf('Level') > 0) {
        
              try {
        
                const skill = prop.replace('Level', '');
                const level = character.skills[prop];
                const experience = character.skills[skill];
                const expPercent = character.skills[skill + 'Procent'];
                const skillButton = document.createElement("div");
                this.characterStats.appendChild(skillButton);
        
                const canTrainClass = skill != 'health' && skill != 'slayer' && skill != 'sailing' ? 'can-train' : '';
                const canTrain = canTrainClass != '';
                const percent = Math.floor(expPercent * 100);
                skillButton.outerHTML = this.characterStatsTemplate
                  .replace('{trainable}', canTrainClass)
                  .replace('{SkillName}', skill)
                  .replace('{SkillName}', skill)
                  .replace('{SkillName}', skill)
                  .replace('{SkillLevel}', level)
                  .replace('{SkillExperience}', experience)
                  .replace('{SkillPercent}', percent);
        
        
                const btn = document.querySelector('.btn-' + skill);
                if (currentSkill == skill) {
                  btn.classList.add("active");
                  btn.title = 'You\'re currently training this skill. (Level Progress ' + percent + '%)';
                  this.activeTaskBtn = btn;
                } else {
                  btn.title =  canTrain 
                    ? 'Click to train ' + skill + ' (Level Progress ' + percent + '%)'
                    : skill + ' (Level Progress ' + percent + '%)';
                }
        
                btn.querySelector('.stats-progress-value').style.width = percent + '%';
        
                if (canTrain) {
                  btn.addEventListener('click', () => {
                    btn.classList.add("active");
                    this.activeTaskBtn.classList.remove("active");
                    this.activeTaskBtn = btn;
        
                    Ravenfall.service.setTaskAsync(Ravenfall.getTaskBySkill(skill), Ravenfall.getTaskArgumentBySkill(skill));
                  });
                }
        
              } catch (err) {
                console.error(err);
              }
            }
          }

    }
}
