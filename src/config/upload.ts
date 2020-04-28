import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpFolder,
  // Digo que vou salvar as imagens dentro do meu disco
  storage: multer.diskStorage({
    // Onde vão ficar as imagens
    destination: tmpFolder,
    // Qual o nome que o arquivo vai receber
    filename(request, file, callback) {
      // Gero um hash para garantir que nenhuma imagem vai ter o mesmo nome de outra imagem
      const fileHash = crypto.randomBytes(10).toString('HEX');
      // Crio o nome do arquivo
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
