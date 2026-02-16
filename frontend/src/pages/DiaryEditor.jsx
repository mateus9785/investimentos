import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function DiaryEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: '',
    entry_date: new Date().toISOString().split('T')[0],
    content: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/diary/${id}`);
      const entry = response.data;
      setForm({
        title: entry.title,
        entry_date: entry.entry_date.split('T')[0],
        content: entry.content || ''
      });
      if (entry.image_path) {
        setImagePreview(`http://localhost:3001${entry.image_path}`);
      }
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = entry.content || '';
        }
      }, 0);
    } catch (error) {
      console.error('Erro ao carregar entrada:', error);
      alert('Erro ao carregar entrada');
      navigate('/diario');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Imagem muito grande. Máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const content = editorRef.current?.innerHTML || '';
      const data = {
        ...form,
        content,
        image: image === null && !imagePreview ? null : image
      };

      if (isEditing) {
        await api.put(`/diary/${id}`, data);
      } else {
        await api.post('/diary', data);
      }

      navigate('/diario');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Carregando...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Editar Entrada' : 'Nova Entrada'}
        </h1>
        <button
          onClick={() => navigate('/diario')}
          className="text-gray-600 hover:text-gray-800"
        >
          Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Título
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Trade PETR4 - Análise"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Data
            </label>
            <input
              type="date"
              value={form.entry_date}
              onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Upload de imagem */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Imagem (opcional)
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-md max-h-64 rounded-lg border"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <p className="text-gray-500">Clique para adicionar imagem</p>
              <p className="text-gray-400 text-sm mt-1">PNG, JPG até 5MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Editor de texto rico */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Conteúdo
          </label>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 bg-gray-100 border border-b-0 border-gray-300 rounded-t-md">
            <button
              type="button"
              onClick={() => execCommand('bold')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold"
              title="Negrito"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => execCommand('italic')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 italic"
              title="Itálico"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => execCommand('underline')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 underline"
              title="Sublinhado"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => execCommand('strikeThrough')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 line-through"
              title="Tachado"
            >
              S
            </button>
            <div className="w-px bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => execCommand('formatBlock', 'h1')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold"
              title="Título 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => execCommand('formatBlock', 'h2')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold text-sm"
              title="Título 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => execCommand('formatBlock', 'h3')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold text-xs"
              title="Título 3"
            >
              H3
            </button>
            <div className="w-px bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => execCommand('insertUnorderedList')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
              title="Lista"
            >
              • Lista
            </button>
            <button
              type="button"
              onClick={() => execCommand('insertOrderedList')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
              title="Lista Numerada"
            >
              1. Lista
            </button>
            <div className="w-px bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => execCommand('justifyLeft')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
              title="Alinhar Esquerda"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => execCommand('justifyCenter')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
              title="Centralizar"
            >
              ◆
            </button>
            <button
              type="button"
              onClick={() => execCommand('justifyRight')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
              title="Alinhar Direita"
            >
              ▶
            </button>
            <div className="w-px bg-gray-300 mx-1" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  execCommand('foreColor', e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
              title="Cor do texto"
            >
              <option value="">Cor</option>
              <option value="#000000">Preto</option>
              <option value="#ef4444">Vermelho</option>
              <option value="#22c55e">Verde</option>
              <option value="#3b82f6">Azul</option>
              <option value="#f59e0b">Amarelo</option>
              <option value="#8b5cf6">Roxo</option>
            </select>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  execCommand('hiliteColor', e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
              title="Destaque"
            >
              <option value="">Destaque</option>
              <option value="#fef08a">Amarelo</option>
              <option value="#bbf7d0">Verde</option>
              <option value="#bfdbfe">Azul</option>
              <option value="#fecaca">Vermelho</option>
            </select>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[300px] p-4 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 prose max-w-none"
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: form.content }}
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/diario')}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
