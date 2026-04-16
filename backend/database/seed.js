/**
 * database/seed.js — тестовые данные
 * Создает тестового пользователя и несколько рецептов
 */

const pool = require('./pool');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    // Создаем тестового пользователя если нет
    const passwordHash = await bcrypt.hash('test12345', 10);
    const userResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_url, bio, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
       RETURNING id, username`,
      ['test_1', 'test1@example.com', passwordHash,
       'https://ui-avatars.com/api/?background=FF6B6B&color=fff&name=test',
       'Люблю готовить итальянскую кухню!', 'user', 'active']
    );
    const userId = userResult.rows[0].id;
    console.log(`✅ Пользователь: ${userResult.rows[0].username} (id: ${userId})`);

    // Создаем администратора если нет
    const adminPasswordHash = await bcrypt.hash('admin12345', 10);
    const adminResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_url, bio, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, username, role`,
      ['admin', 'admin@flavorfusion.com', adminPasswordHash,
       'https://ui-avatars.com/api/?background=4ECDC4&color=fff&name=Admin',
       'Администратор платформы FlavorFusion', 'admin', 'active']
    );
    if (adminResult.rows.length > 0) {
      console.log(`👑 Админ создан: ${adminResult.rows[0].username} (id: ${adminResult.rows[0].id}, роль: ${adminResult.rows[0].role})`);
      console.log(`   Email: admin@flavorfusion.com`);
      console.log(`   Пароль: admin12345`);
    } else {
      console.log(`ℹ️  Админ уже существует`);
    }

    // Тестовые рецепты
    const recipes = [
      {
        title: 'Паста Карбонара',
        description: 'Классическая итальянская паста с хрустящим беконом и сливочным соусом. Просто и невероятно вкусно!',
        full_description: 'Карбонара — одно из самых известных блюд римской кухни. Секрет идеального соуса — в балансе яиц, сыра и температуры. Никаких сливок — только желтки, пекорино и гуанчиале.',
        image_url: 'images/спагети.jpg',
        ingredients: JSON.stringify(['400г спагетти', '200г гуанчиале (или панчетта)', '4 желтка', '100г пекорино романо', 'Чёрный перец']),
        instructions: 'Отварите пасту в подсоленной воде.\nОбжарьте гуанчиале до хрустящей корочки.\nСмешайте желтки с тёртым пекорино и перцем.\nСоедините горячую пасту с беконом.\nВлейте яичную смесь, быстро перемешивая.\nПодавайте немедленно с дополнительным пекорино.',
        time: '25 мин',
        difficulty: 'Средняя',
        category: '🍝 Основные блюда',
        servings: 4,
        tags: 'итальянская, паста, классика',
        calories: '520',
        protein: '22',
        carbs: '65',
        fat: '18',
      },
      {
        title: 'Тирамису',
        description: 'Нежнейший итальянский десерт с маскарпоне и эспрессо. Тает во рту!',
        full_description: 'Тирамису — визитная карточка итальянской кондитерской. Лёгкий крем из маскарпоне, пропитанное кофе савоярди и щедрый слой какао создают неповторимый вкус.',
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
        ingredients: JSON.stringify(['500г маскарпоне', '6 яиц', '150г сахара', '300мл крепкого эспрессо', '3 ст.л. амаретто', '400г савоярди', 'Какао-порошок']),
        instructions: 'Взбейте желтки с сахаром до белизны.\nДобавьте маскарпоне, аккуратно перемешайте.\nВзбейте белки до пиков, вмешайте в крем.\nСмешайте остывший эспрессо с амаретто.\nОкунайте савоярди в кофе и выкладывайте слоями.\nЧередуйте слои крема и печенья.\nПосыпьте какао и уберите в холодильник на 4 часа.',
        time: '40 мин + 4ч',
        difficulty: 'Сложная',
        category: '🍰 Десерт',
        servings: 8,
        tags: 'итальянская, десерт, кофе',
        calories: '450',
        protein: '8',
        carbs: '55',
        fat: '22',
      },
      {
        title: 'Салат «Цезарь» с курицей',
        description: 'Хрустящий ромэн, сочная курица и фирменный соус Цезарь. Классика, которая никогда не надоедает.',
        full_description: 'Оригинальный рецепт салата «Цезарь» был создан в 1924 году в Тихуане. Мы адаптировали его для домашней кухни, сохранив баланс вкусов.',
        image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&h=600&fit=crop',
        ingredients: JSON.stringify(['1 кочан романа', '500г куриного филе', '100г пармезана', '100г крутонов', '2 анчоуса', '1 зубчик чеснока', 'Оливковое масло', 'Лимонный сок']),
        instructions: 'Обжарьте куриное филе до золотистой корочки.\nНарежьте курицу ломтиками.\nПриготовьте соус: смешайте анчоусы, чеснок, масло и лимон.\nНарвите ромэн руками.\nСмешайте салат с соусом.\nВыложите курицу, крутоны и стружку пармезана.',
        time: '30 мин',
        difficulty: 'Лёгкая',
        category: '🥗 Салаты',
        servings: 4,
        tags: 'салат, курица, классика',
        calories: '320',
        protein: '28',
        carbs: '18',
        fat: '16',
      },
      {
        title: 'Том Ям с креветками',
        description: 'Острый тайский суп с креветками, кокосовым молоком и лемонграссом. Яркий вкус Юго-Восточной Азии.',
        full_description: 'Том Ям — король тайской кухни. Сочетание острого, кислого, солёного и сладкого создаёт неповторимый букет. Секрет — в свежих ингредиентах и правильном балансе.',
        image_url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b2f5e?w=800&h=600&fit=crop',
        ingredients: JSON.stringify(['400г тигровых креветок', '400мл кокосового молока', '2 стебля лемонграсса', '4 листа кафир-лайма', '3 перца чили', '200г грибов шиитаке', 'Рыбный соус', 'Сок лайма', 'Кинза']),
        instructions: 'Вскипятите куриный бульон.\nДобавьте нарезанный лемонграсс и листья лайма.\nПоложите грибы, варите 5 минут.\nДобавьте креветки, варите 2 минуты.\nВлейте кокосовое молоко.\nПриправьте рыбным соусом, чили и соком лайма.\nПодавайте с кинзой и жасминовым рисом.',
        time: '35 мин',
        difficulty: 'Средняя',
        category: '🍲 Супы',
        servings: 4,
        tags: 'тайская, острое, суп',
        calories: '280',
        protein: '24',
        carbs: '12',
        fat: '15',
      },
      {
        title: 'Панкейки с черникой',
        description: 'Пышные американские блинчики с свежими ягодами и кленовым сиропом. Идеальный завтрак выходного дня.',
        full_description: 'Секрет пышных панкейков — в правильной температуре сковороды и не перемешивайте тесто слишком активно. Комочки — это нормально!',
        image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
        ingredients: JSON.stringify(['200г муки', '2 яйца', '250мл молока', '2 ст.л. сахара', '1 ч.л. разрыхлителя', 'Щепотка соли', '200г свежей черники', 'Кленовый сироп', 'Сливочное масло']),
        instructions: 'Смешайте сухие ингредиенты.\nДобавьте яйца и молоко, перемешайте до однородности (комочки допустимы).\nРазогрейте сковороду на среднем огне, смажьте маслом.\nВыливайте по 2-3 ст.л. теста на сковороду.\nКогда появятся пузырьки — переворачивайте.\nОбжарьте с двух сторон до золотистого цвета.\nПодавайте с черникой и кленовым сиропом.',
        time: '20 мин',
        difficulty: 'Лёгкая',
        category: '🍳 Завтрак',
        servings: 3,
        tags: 'завтрак, сладкое, ягоды',
        calories: '380',
        protein: '10',
        carbs: '52',
        fat: '14',
      },
      {
        title: 'Ризотто с грибами',
        description: 'Кремовое ризотто с белыми грибами и пармезаном. Итальянская классика, которая покорит ваше сердце.',
        full_description: 'Настоящее ризотто — это не просто каша с грибами. Постоянное помешивание и постепенное добавление бульона высвобождают крахмал, создавая ту самую кремовую текстуру.',
        image_url: 'https://images.unsplash.com/photo-1476124369491-e7edda5e3880?w=800&h=600&fit=crop',
        ingredients: JSON.stringify(['300г риса арборио', '300г белых грибов', '1л горячего бульона', '1 луковица', '100мл белого вина', '80г пармезана', '50г сливочного масла', 'Оливковое масло']),
        instructions: 'Обжарьте грибы на оливковом масле, отложите.\nВ той же сковороде обжарьте лук.\nДобавьте рис, обжаривайте 2 минуты.\nВлейте вино, помешивайте до испарения.\nДобавляйте горячий бульон по половнику, помешивая.\nКогда рис аль денте (18 мин), добавьте грибы и масло.\nВмешайте пармезан, дайте отдохнуть 2 минуты.',
        time: '40 мин',
        difficulty: 'Средняя',
        category: '🍝 Основные блюда',
        servings: 4,
        tags: 'итальянская, грибы, рис',
        calories: '480',
        protein: '14',
        carbs: '62',
        fat: '18',
      },
    ];

    for (const recipe of recipes) {
      await pool.query(
        `INSERT INTO recipes (
          author_id, title, description, full_description,
          image_url, ingredients, instructions, time,
          difficulty, category, servings, tags,
          calories, protein, carbs, fat
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16
        )`,
        [
          userId, recipe.title, recipe.description, recipe.full_description,
          recipe.image_url, recipe.ingredients, recipe.instructions, recipe.time,
          recipe.difficulty, recipe.category, recipe.servings, recipe.tags,
          recipe.calories, recipe.protein, recipe.carbs, recipe.fat,
        ]
      );
      console.log(`✅ Рецепт: ${recipe.title}`);
    }

    console.log('\n🎉 Seed завершён успешно!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
