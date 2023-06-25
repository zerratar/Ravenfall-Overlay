import { SubView } from "./BaseViews.js";


export class TrainingView extends SubView {
    constructor(parentView) {
        super(parentView, 'training');

        this.activeCharacter = null;
        this.characterStats = document.querySelector('.character-stats');
        // todo(zerratar): replace to use actual <template></template>
        this.characterStatsTemplate = document.querySelector('.character-stat').outerHTML;
        this.characterStats.innerHTML = '';
        this.activeTaskBtn = null;
        Views.training = this;
    }

    onExpUpdated(data) {
      // this is so not a good way to do this, but it works for now
      this.onCharacterUpdated(this.activeCharacter);
    }


    onCharacterUpdated(character) {
        this.activeCharacter = character;
        this.characterStats.innerHTML = '';
        const currentSkill = Ravenfall.getCurrentSkill();
        let props = Object.keys(character.skills);
        
        props = ["allLevel", ...props];

        for (let prop of props) {
            if (prop.indexOf('Level') > 0) {
        
              try {
        
                const skill = prop.replace('Level', '');
                const isAll = skill == 'all';
                
                let level = 1;
                let experience = 0;
                let expPercent = 0;

                if (isAll) {
                  level = character.combatLevel;
                } else {
                  level = character.skills[prop];
                  experience = character.skills[skill];
                  expPercent = character.skills[skill + 'Procent'];
                }
               
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
        
                  // remove progress bar for "is all"
                  if (isAll) {
                    let statsProgressBar = skillButton.querySelector('.stats-progress');
                    if (statsProgressBar) {
                      statsProgressBar.remove();
                    }
                  }

        
                const btn = document.querySelector('.btn-' + skill);

                if (currentSkill == skill) {
                  btn.classList.add("active");
                  btn.title = 'You\'re currently training this skill. (Level Progress ' + percent + '%, Exp: ' + Math.floor(experience) + ')';
                  this.activeTaskBtn = btn;
                } else {
                  btn.title =  canTrain 
                    ? 'Click to train ' + skill + ' (Level Progress ' + percent + '%)'
                    : skill + ' (Level Progress ' + percent + '%)';
                }
        
                btn.querySelector('.stats-progress-value').style.width = percent + '%';
        
                if (canTrain) {
                  btn.addEventListener('click', () => {
                    if (this.activeTaskBtn != null) {
                      this.activeTaskBtn.classList.remove("active");
                    }
                    this.activeTaskBtn = btn;
                    btn.classList.add("active");
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
