import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      // Começa da linha 2
      from_line: 2,
    });

    // Vai ir lendo as linhas
    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        // remove os espaçamentos
        cell.trim(),
      );

      // Se algum dos campos não existir, retorno erro
      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    // O parseCSV só vai nos retornar quando a função end dele for terminada
    await new Promise(resolve => parseCSV.on('end', resolve));

    // Mapeando as categorias no BD //
    // Busco por todas as categories dentro do banco
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    // Percorro minhas categorias encontradas no BD e pego somente o title delas
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    // Me retorna todas as categorias que não estão no BD
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      // Retiro os meus duplicados
      .filter((value, index, self) => self.indexOf(value) === index);

    // Crio o obejto de categorias
    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    // Salvo o objeto no BD
    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    // Fim - Mapeando as categorias no BD //

    // Criar as transactions //
    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
