import { TEMPLATES_FOLDER } from '../constants';

export function registerHelpers(): void {
  Handlebars.registerHelper('gurpslink', GURPS.gurpslink);
  Handlebars.registerHelper('isEmptyString', (string: string) => string === '');
  Handlebars.registerHelper('getHeader', (header) => {
    switch (header) {
      case 'weapon':
        return 'Arma';
      case 'levelWithModifiers':
        return 'Nivel';
      case 'damage':
        return 'Daño';
      case 'accuracy':
        return 'Precisión';
      case 'range':
        return 'Rango';
      case 'remainingRounds':
        return 'Turnos para preparar';
      case 'reach':
        return 'Alcance';
      case 'roll':
        return 'Tirada';
      case 'where':
        return 'Localización';
      case 'penalty':
        return 'Penalización';
    }
    return header;
  });
  Handlebars.registerHelper('get', (obj, prop) => obj[prop]);
  Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  });
}

export async function registerPartials(): Promise<void> {
  Handlebars.registerPartial('choiceTable', await getTemplate(`${TEMPLATES_FOLDER}/partials/choiceTable.hbs`));
}
