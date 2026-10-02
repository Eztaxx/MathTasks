import { describe, expect, it } from 'vitest';
import { checkTaskAnswer, composeFraction, fractionAnswerKind, splitFraction } from '../public/lib.js';

/* Поле-дробь: когда ответ — дробь или смешанное число, ученик заполняет
   бланк «целое, числитель, знаменатель». Строка из бланка должна проходить
   ту же проверку, что и набранная руками. */
describe('fractionAnswerKind: когда рисовать бланк дроби', () => {
  it('обыкновенная дробь', () => {
    expect(fractionAnswerKind('\\frac{7}{4}')).toBe('fraction');
    expect(fractionAnswerKind('$\\frac{2}{7}$')).toBe('fraction');
    expect(fractionAnswerKind('\\dfrac{1}{8}')).toBe('fraction');
    expect(fractionAnswerKind('-\\frac{3}{4}')).toBe('fraction');
  });

  it('смешанное число', () => {
    expect(fractionAnswerKind('1\\frac{1}{5}')).toBe('mixed');
    expect(fractionAnswerKind('$13\\frac{1}{5}$')).toBe('mixed');
    expect(fractionAnswerKind('-2\\frac{1}{3}')).toBe('mixed');
  });

  it('всё остальное — обычное поле', () => {
    expect(fractionAnswerKind('9')).toBe('');
    expect(fractionAnswerKind('0{,}5')).toBe('');
    expect(fractionAnswerKind('\\frac{a}{b}')).toBe('');
    expect(fractionAnswerKind('\\frac{3}{4}x')).toBe('');
    expect(fractionAnswerKind('\\frac{1}{2} + \\frac{1}{3}')).toBe('');
    expect(fractionAnswerKind('\\frac{x+1}{2}')).toBe('');
    expect(fractionAnswerKind('\\text{Масса} = \\frac{1}{2}')).toBe('');
    expect(fractionAnswerKind('')).toBe('');
    expect(fractionAnswerKind(null)).toBe('');
  });
});

describe('composeFraction: части бланка в строку', () => {
  it('смешанное число, дробь и просто число', () => {
    expect(composeFraction({ whole: '1', num: '1', den: '2' })).toBe('1 1/2');
    expect(composeFraction({ num: '3', den: '8' })).toBe('3/8');
    expect(composeFraction({ num: '5' })).toBe('5');
    expect(composeFraction({ whole: '4' })).toBe('4');
    expect(composeFraction({ num: '0,5' })).toBe('0,5');
  });

  it('лишние пробелы убираются, типографский минус становится дефисом', () => {
    expect(composeFraction({ whole: ' 2 ', num: '1 ', den: ' 3' })).toBe('2 1/3');
    expect(composeFraction({ num: '−3', den: '4' })).toBe('-3/4');
  });

  it('пустой бланк — пустая строка', () => {
    expect(composeFraction({})).toBe('');
    expect(composeFraction()).toBe('');
  });
});

describe('splitFraction: строка в части бланка', () => {
  it('разбирает смешанное число и дробь', () => {
    expect(splitFraction('1 1/2')).toEqual({ whole: '1', num: '1', den: '2' });
    expect(splitFraction('3/8')).toEqual({ whole: '', num: '3', den: '8' });
    expect(splitFraction('-3/4')).toEqual({ whole: '', num: '-3', den: '4' });
    expect(splitFraction('-2 1/3')).toEqual({ whole: '-2', num: '1', den: '3' });
  });

  it('знаменатель ещё не набран: «1 1/» и «3/»', () => {
    expect(splitFraction('1 1/')).toEqual({ whole: '1', num: '1', den: '' });
    expect(splitFraction('3/')).toEqual({ whole: '', num: '3', den: '' });
  });

  it('число и произвольный текст уходят в числитель', () => {
    expect(splitFraction('5')).toEqual({ whole: '', num: '5', den: '' });
    expect(splitFraction('0,5')).toEqual({ whole: '', num: '0,5', den: '' });
    expect(splitFraction('')).toEqual({ whole: '', num: '', den: '' });
  });

  it('обратимо: части → строка → части', () => {
    for (const parts of [
      { whole: '1', num: '1', den: '2' },
      { whole: '', num: '2', den: '7' },
      { whole: '', num: '9', den: '' }
    ]) {
      expect(splitFraction(composeFraction(parts))).toEqual(parts);
    }
  });
});

describe('строка из бланка проходит обычную проверку ответа', () => {
  it('смешанное число', () => {
    const answer = '$1\\frac{1}{5}$';
    expect(checkTaskAnswer(composeFraction({ whole: '1', num: '1', den: '5' }), answer)).toBe(true);
    expect(checkTaskAnswer(composeFraction({ whole: '1', num: '1', den: '4' }), answer)).toBe(false);
    // Неправильная дробь, равная ответу, тоже верна.
    expect(checkTaskAnswer(composeFraction({ num: '6', den: '5' }), answer)).toBe(true);
  });

  it('обыкновенная дробь', () => {
    const answer = '$\\frac{7}{4}$';
    expect(checkTaskAnswer(composeFraction({ num: '7', den: '4' }), answer)).toBe(true);
    expect(checkTaskAnswer(composeFraction({ whole: '1', num: '3', den: '4' }), answer)).toBe(true);
    expect(checkTaskAnswer(composeFraction({ num: '7', den: '5' }), answer)).toBe(false);
  });
});
