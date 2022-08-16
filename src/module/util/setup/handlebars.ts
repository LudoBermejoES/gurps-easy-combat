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
      case 'mode':
        return 'Modo';
      case 'rof':
        return 'Ratio de fuego';
    }
    return header;
  });
  Handlebars.registerHelper('get', (obj, prop) => {
    if (prop.toLowerCase() === 'mode') {
      const data = obj[prop].toLowerCase();
      switch (data) {
        case 'bite':
          return 'Mordisco';
        case 'kick':
          return 'Patada';
        case 'punch':
          return 'Puñetazo';
        case 'swung':
          return 'Mandoble';
        case 'thrust':
          return 'Acometida';
      }
    }
    if (prop.toLowerCase() === 'where') {
      const result = game.i18n.localize(`GURPS.hitLocation${obj[prop]}`);
      if (result) return result;
    }
    return obj[prop];
  });
  Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('i18nHitLocation', function (value, fallback) {
    const result = game.i18n.localize(`GURPS.hitLocation${value}`);
    if (result) return result;
    return value;
  });
}

export async function registerPartials(): Promise<void> {
  Handlebars.registerPartial('choiceTable', await getTemplate(`${TEMPLATES_FOLDER}/partials/choiceTable.hbs`));
}
