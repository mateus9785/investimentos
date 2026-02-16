const Diary = require('../models/Diary');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diaryController = {
  async index(req, res) {
    try {
      const { month, year } = req.query;
      const filters = {};

      if (month && year) {
        filters.month = parseInt(month);
        filters.year = parseInt(year);
      }

      const entries = await Diary.findByUser(req.userId, filters);
      return res.json(entries);
    } catch (error) {
      console.error('Erro ao listar diário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async show(req, res) {
    try {
      const entry = await Diary.findById(req.params.id, req.userId);

      if (!entry) {
        return res.status(404).json({ error: 'Entrada não encontrada' });
      }

      return res.json(entry);
    } catch (error) {
      console.error('Erro ao buscar entrada:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { title, content, entry_date, image } = req.body;

      if (!title || !entry_date) {
        return res.status(400).json({ error: 'Título e data são obrigatórios' });
      }

      let image_path = null;

      if (image && image.startsWith('data:image')) {
        const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1];
          const data = matches[2];
          const filename = `diary_${Date.now()}.${ext}`;
          const filepath = path.join(uploadsDir, filename);
          fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
          image_path = `/uploads/${filename}`;
        }
      }

      const id = await Diary.create(req.userId, {
        title,
        content,
        image_path,
        entry_date
      });

      const entry = await Diary.findById(id, req.userId);
      return res.status(201).json(entry);
    } catch (error) {
      console.error('Erro ao criar entrada:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const { title, content, entry_date, image } = req.body;

      const entry = await Diary.findById(req.params.id, req.userId);

      if (!entry) {
        return res.status(404).json({ error: 'Entrada não encontrada' });
      }

      let image_path = entry.image_path;

      if (image === null) {
        if (entry.image_path) {
          const oldPath = path.join(__dirname, '../..', entry.image_path);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        image_path = null;
      } else if (image && image.startsWith('data:image')) {
        if (entry.image_path) {
          const oldPath = path.join(__dirname, '../..', entry.image_path);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1];
          const data = matches[2];
          const filename = `diary_${Date.now()}.${ext}`;
          const filepath = path.join(uploadsDir, filename);
          fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
          image_path = `/uploads/${filename}`;
        }
      }

      await Diary.update(req.params.id, req.userId, {
        title: title ?? entry.title,
        content: content ?? entry.content,
        image_path,
        entry_date: entry_date ?? entry.entry_date
      });

      const updatedEntry = await Diary.findById(req.params.id, req.userId);
      return res.json(updatedEntry);
    } catch (error) {
      console.error('Erro ao atualizar entrada:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async destroy(req, res) {
    try {
      const { deleted, imagePath } = await Diary.delete(req.params.id, req.userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Entrada não encontrada' });
      }

      if (imagePath) {
        const filepath = path.join(__dirname, '../..', imagePath);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar entrada:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = diaryController;
