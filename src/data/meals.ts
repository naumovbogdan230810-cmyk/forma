export type Tag = 'meat' | 'fish' | 'milk' | 'eggs' | 'gluten'
export type Cat = 'Крупы и хлеб' | 'Мясо и рыба' | 'Молочное и яйца' | 'Овощи и фрукты' | 'Прочее'

export interface Product {
  name: string
  /** на 100 г: ккал, белки, жиры, углеводы */
  k: number; p: number; f: number; c: number
  cat: Cat
  cost: 1 | 2 | 3
  tag?: Tag
  /** вес одной штуки, если продукт считают штуками */
  piece?: number
}

const pr = (name: string, k: number, p: number, f: number, c: number, cat: Cat, cost: 1 | 2 | 3 = 1, o: Partial<Product> = {}): Product =>
  ({ name, k, p, f, c, cat, cost, ...o })

const G: Cat = 'Крупы и хлеб', M: Cat = 'Мясо и рыба', D: Cat = 'Молочное и яйца', V: Cat = 'Овощи и фрукты', O: Cat = 'Прочее'

export const PRODUCTS: Record<string, Product> = {
  oats: pr('Овсяные хлопья', 366, 12, 6, 62, G, 1, { tag: 'gluten' }),
  buckwheat: pr('Гречка', 330, 12.6, 3.3, 62, G),
  rice: pr('Рис', 344, 6.7, 0.7, 78, G),
  pasta: pr('Макароны', 350, 12, 1.5, 71, G, 1, { tag: 'gluten' }),
  bulgur: pr('Булгур', 342, 12, 1.3, 76, G, 1, { tag: 'gluten' }),
  bread: pr('Хлеб цельнозерновой', 250, 9, 3, 45, G, 1, { tag: 'gluten' }),
  lavash: pr('Лаваш', 275, 9, 1, 58, G, 1, { tag: 'gluten' }),
  lentils: pr('Чечевица', 295, 24, 1.5, 46, G),
  chicken: pr('Куриная грудка', 113, 23.6, 1.9, 0.4, M, 1, { tag: 'meat' }),
  thigh: pr('Филе куриного бедра', 185, 19, 11, 0, M, 1, { tag: 'meat' }),
  turkey: pr('Филе индейки', 115, 24, 1.5, 0, M, 2, { tag: 'meat' }),
  beef: pr('Говядина постная', 160, 21, 8, 0, M, 3, { tag: 'meat' }),
  mince: pr('Куриный фарш', 143, 17.4, 8.1, 0, M, 1, { tag: 'meat' }),
  pollock: pr('Минтай, филе', 72, 16, 1, 0, M, 1, { tag: 'fish' }),
  salmon: pr('Горбуша', 140, 20.5, 6.5, 0, M, 2, { tag: 'fish' }),
  tuna: pr('Тунец консервированный', 100, 22, 1, 0, M, 2, { tag: 'fish' }),
  eggs: pr('Яйца', 157, 12.7, 11.5, 0.7, D, 1, { tag: 'eggs', piece: 55 }),
  cottage: pr('Творог 5 %', 121, 17, 5, 1.8, D, 1, { tag: 'milk' }),
  milk: pr('Молоко 2,5 %', 52, 2.8, 2.5, 4.7, D, 1, { tag: 'milk' }),
  kefir: pr('Кефир 1 %', 40, 3, 1, 4, D, 1, { tag: 'milk' }),
  yogurt: pr('Йогурт греческий 2 %', 66, 8, 2, 4, D, 2, { tag: 'milk' }),
  cheese: pr('Сыр', 350, 25, 27, 0, D, 2, { tag: 'milk' }),
  sour: pr('Сметана 15 %', 160, 2.6, 15, 3, D, 1, { tag: 'milk' }),
  tofu: pr('Тофу', 76, 8, 4.8, 1.9, O, 2),
  beans: pr('Фасоль консервированная', 99, 6.7, 0.3, 17.4, O),
  chickpea: pr('Нут консервированный', 120, 7, 2.5, 16, O, 2),
  potato: pr('Картофель', 77, 2, 0.4, 16, V),
  banana: pr('Бананы', 95, 1.5, 0.2, 21.8, V),
  apple: pr('Яблоки', 47, 0.4, 0.4, 9.8, V),
  berries: pr('Ягоды замороженные', 45, 0.8, 0.4, 9, V, 2),
  tomato: pr('Помидоры', 20, 0.9, 0.2, 3.7, V),
  cucumber: pr('Огурцы', 15, 0.8, 0.1, 2.8, V),
  cabbage: pr('Капуста', 27, 1.8, 0.1, 4.7, V),
  carrot: pr('Морковь', 35, 1.3, 0.1, 6.9, V),
  onion: pr('Лук', 41, 1.4, 0, 8.2, V),
  vegmix: pr('Овощная смесь замороженная', 40, 2.5, 0.3, 6.5, V),
  broccoli: pr('Брокколи', 34, 2.8, 0.4, 6.6, V, 2),
  greens: pr('Зелень и салат', 15, 1.3, 0.2, 2, V),
  pepper: pr('Перец сладкий', 27, 1.3, 0, 5.3, V, 2),
  mushrooms: pr('Шампиньоны', 27, 4.3, 1, 0.1, V, 2),
  oil: pr('Масло растительное', 899, 0, 99.9, 0, O),
  nuts: pr('Орехи', 610, 18, 55, 12, O, 2),
  pb: pr('Арахисовая паста', 590, 25, 50, 20, O, 2),
  honey: pr('Мёд', 329, 0.8, 0, 81.5, O),
  choco: pr('Тёмный шоколад', 540, 6, 35, 48, O, 2),
  dried: pr('Сухофрукты', 240, 3, 0.5, 58, O),
  tpaste: pr('Томатная паста', 80, 4, 0.5, 15, O),
}

export type MealType = 'b' | 'm' | 's'
export interface Dish {
  id: string
  name: string
  t: MealType
  ing: [keyof typeof PRODUCTS | string, number][]
  /** готовится быстро и просто */
  easy?: boolean
}

const d = (id: string, name: string, t: MealType, ing: [string, number][], easy = false): Dish => ({ id, name, t, ing, easy })

export const DISHES: Dish[] = [
  // Завтраки
  d('oat_banana', 'Овсянка на молоке с бананом', 'b', [['oats', 60], ['milk', 200], ['banana', 100], ['honey', 10]], true),
  d('oat_pb', 'Овсянка с арахисовой пастой и яблоком', 'b', [['oats', 60], ['milk', 150], ['pb', 15], ['apple', 100]], true),
  d('oat_nuts', 'Овсянка на воде с бананом и орехами', 'b', [['oats', 70], ['banana', 120], ['nuts', 20]], true),
  d('omelet', 'Омлет с сыром, помидорами и хлебом', 'b', [['eggs', 165], ['milk', 50], ['cheese', 30], ['tomato', 100], ['bread', 50]], true),
  d('fried_eggs', 'Яичница с овощами и хлебом', 'b', [['eggs', 110], ['tomato', 100], ['greens', 30], ['bread', 60], ['oil', 5]], true),
  d('cottage_banana', 'Творог с бананом и мёдом', 'b', [['cottage', 200], ['banana', 100], ['honey', 10]], true),
  d('cottage_berries', 'Творог с ягодами и орехами', 'b', [['cottage', 200], ['berries', 100], ['nuts', 20]], true),
  d('yogurt_bowl', 'Йогурт с овсянкой и ягодами', 'b', [['yogurt', 250], ['oats', 40], ['berries', 100], ['honey', 10]], true),
  d('buck_eggs', 'Гречневая каша с яйцом и огурцом', 'b', [['buckwheat', 60], ['eggs', 110], ['cucumber', 100]], true),
  d('sandwich', 'Бутерброды с яйцом и сыром', 'b', [['bread', 80], ['eggs', 110], ['cheese', 30], ['cucumber', 100]], true),
  d('lavash_cottage', 'Лаваш с творогом и зеленью', 'b', [['lavash', 70], ['cottage', 150], ['greens', 30], ['cucumber', 100]], true),
  d('tofu_scramble', 'Скрэмбл из тофу с овощами', 'b', [['tofu', 200], ['pepper', 100], ['tomato', 100], ['oil', 5], ['bread', 60]], true),
  d('rice_porridge', 'Рисовая каша с яблоком и орехами', 'b', [['rice', 60], ['apple', 150], ['nuts', 20], ['honey', 10]], true),
  d('buck_banana', 'Гречка с бананом и арахисовой пастой', 'b', [['buckwheat', 60], ['banana', 100], ['pb', 20]], true),
  // Основные блюда
  d('chicken_buck', 'Куриная грудка с гречкой и овощами', 'm', [['chicken', 150], ['buckwheat', 70], ['cucumber', 100], ['tomato', 100], ['oil', 5]]),
  d('chicken_rice', 'Курица с рисом и брокколи', 'm', [['chicken', 150], ['rice', 70], ['broccoli', 150], ['oil', 5]]),
  d('chicken_pasta', 'Паста с курицей в томатном соусе', 'm', [['pasta', 80], ['chicken', 130], ['tpaste', 40], ['onion', 30], ['oil', 5]]),
  d('thigh_potato', 'Запечённое куриное бедро с картофелем', 'm', [['thigh', 150], ['potato', 250], ['carrot', 50], ['oil', 5]]),
  d('turkey_bulgur', 'Индейка с булгуром и салатом', 'm', [['turkey', 150], ['bulgur', 70], ['cucumber', 100], ['greens', 30], ['oil', 5]]),
  d('beef_buck', 'Тушёная говядина с гречкой', 'm', [['beef', 130], ['buckwheat', 70], ['onion', 30], ['carrot', 50]]),
  d('mince_pasta', 'Макароны по-флотски', 'm', [['pasta', 80], ['mince', 120], ['onion', 30], ['oil', 5]], true),
  d('cutlets_potato', 'Куриные котлеты с пюре и капустой', 'm', [['mince', 150], ['potato', 250], ['milk', 50], ['cabbage', 100]]),
  d('plov', 'Плов с курицей', 'm', [['rice', 80], ['thigh', 120], ['carrot', 60], ['onion', 30], ['oil', 7]]),
  d('chicken_soup', 'Куриный суп с лапшой', 'm', [['chicken', 120], ['pasta', 40], ['potato', 150], ['carrot', 40], ['onion', 30]]),
  d('chicken_cabbage', 'Тушёная капуста с курицей', 'm', [['chicken', 150], ['cabbage', 300], ['carrot', 50], ['tpaste', 20], ['oil', 7], ['bread', 50]]),
  d('chicken_wrap', 'Лаваш с курицей и овощами', 'm', [['lavash', 80], ['chicken', 130], ['tomato', 80], ['cucumber', 80], ['yogurt', 40]]),
  d('pollock_rice', 'Минтай с рисом и овощами', 'm', [['pollock', 200], ['rice', 70], ['vegmix', 150], ['oil', 7]]),
  d('salmon_potato', 'Запечённая горбуша с картофелем', 'm', [['salmon', 150], ['potato', 250], ['greens', 30], ['oil', 5]]),
  d('tuna_pasta', 'Паста с тунцом и помидорами', 'm', [['pasta', 80], ['tuna', 100], ['tomato', 100], ['oil', 7]], true),
  d('tuna_salad', 'Салат с тунцом, яйцом и фасолью', 'm', [['tuna', 100], ['eggs', 110], ['beans', 120], ['cucumber', 100], ['greens', 40], ['oil', 7]], true),
  d('tuna_wrap', 'Лаваш с тунцом и овощами', 'm', [['lavash', 80], ['tuna', 100], ['cucumber', 100], ['greens', 30], ['yogurt', 40]], true),
  d('buck_eggs_main', 'Гречка с яичницей и овощами', 'm', [['buckwheat', 70], ['eggs', 165], ['tomato', 100], ['cucumber', 100]], true),
  d('egg_rice', 'Жареный рис с яйцом и овощами', 'm', [['rice', 70], ['eggs', 110], ['vegmix', 150], ['oil', 7]], true),
  d('potato_cottage', 'Отварной картофель с творогом и зеленью', 'm', [['potato', 300], ['cottage', 150], ['greens', 30], ['sour', 20]], true),
  d('lentil_stew', 'Чечевица, тушёная с овощами', 'm', [['lentils', 90], ['carrot', 60], ['onion', 40], ['tpaste', 30], ['oil', 7]]),
  d('beans_rice', 'Рис с фасолью и овощами', 'm', [['rice', 70], ['beans', 200], ['pepper', 100], ['tpaste', 30], ['oil', 7]], true),
  d('tofu_rice', 'Тофу с рисом и овощами', 'm', [['tofu', 200], ['rice', 70], ['vegmix', 150], ['oil', 7]], true),
  d('chickpea_bulgur', 'Нут с булгуром и овощами', 'm', [['chickpea', 200], ['bulgur', 60], ['tomato', 100], ['cucumber', 100], ['oil', 7]], true),
  d('buck_mush', 'Гречка с грибами и фасолью', 'm', [['buckwheat', 80], ['mushrooms', 150], ['beans', 100], ['onion', 40], ['oil', 7]]),
  d('lentil_rice', 'Чечевица с рисом и салатом', 'm', [['lentils', 60], ['rice', 50], ['tomato', 100], ['cucumber', 100], ['oil', 7]]),
  // Перекусы
  d('apple_nuts', 'Яблоко и орехи', 's', [['apple', 180], ['nuts', 25]], true),
  d('banana_yogurt', 'Йогурт с бананом', 's', [['yogurt', 200], ['banana', 120]], true),
  d('kefir_bread', 'Кефир и тост с сыром', 's', [['kefir', 250], ['bread', 40], ['cheese', 20]], true),
  d('cottage_snack', 'Творог со сметаной и ягодами', 's', [['cottage', 150], ['sour', 20], ['berries', 50]], true),
  d('pb_toast', 'Тост с арахисовой пастой и бананом', 's', [['bread', 50], ['pb', 20], ['banana', 80]], true),
  d('eggs_snack', 'Варёные яйца с огурцом', 's', [['eggs', 110], ['cucumber', 150]], true),
  d('dried_nuts', 'Сухофрукты с орехами', 's', [['dried', 40], ['nuts', 25]], true),
  d('choco_banana', 'Банан и тёмный шоколад', 's', [['banana', 150], ['choco', 20]], true),
  d('tuna_toast', 'Тост с тунцом и огурцом', 's', [['bread', 50], ['tuna', 70], ['cucumber', 80]], true),
  d('fruit', 'Банан и яблоко', 's', [['banana', 120], ['apple', 180]], true),
  d('chickpea_snack', 'Нут с перцем и зеленью', 's', [['chickpea', 150], ['pepper', 100], ['greens', 20], ['oil', 5]], true),
]

export const DISH: Record<string, Dish> = Object.fromEntries(DISHES.map((x) => [x.id, x]))
