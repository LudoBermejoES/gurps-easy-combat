import { TEMPLATES_FOLDER } from '../constants';

export function registerHelpers(): void {
  Handlebars.registerHelper('gurpslink', GURPS.gurpslink);
  Handlebars.registerHelper('isEmptyString', (string: string) => string === '');
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
