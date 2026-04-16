import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Artist } from '../types';
import { Plus, Edit2, Trash2, X, Check, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminDashboardProps {
  artists: Artist[];
}

export default function AdminDashboard({ artists }: AdminDashboardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    genre: '',
    photoUrl: ''
  });

  const resetForm = () => {
    setFormData({ name: '', genre: '', photoUrl: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artists'), {
        ...formData,
        voteCount: 0
      });
      toast.success('Đã thêm nghệ sĩ mới');
      resetForm();
    } catch (error) {
      toast.error('Lỗi khi thêm nghệ sĩ');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const artistRef = doc(db, 'artists', editingId);
      await updateDoc(artistRef, formData);
      toast.success('Đã cập nhật thông tin');
      resetForm();
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nghệ sĩ này?')) return;
    try {
      await deleteDoc(doc(db, 'artists', id));
      toast.success('Đã xóa nghệ sĩ');
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  const startEdit = (artist: Artist) => {
    setFormData({
      name: artist.name,
      genre: artist.genre,
      photoUrl: artist.photoUrl
    });
    setEditingId(artist.id);
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 bg-white p-8 border border-black/10">
      <div className="flex items-center justify-between border-b border-black/10 pb-4">
        <h3 className="text-xl font-serif italic">Quản Lý Nghệ Sĩ</h3>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-black/80 transition-colors"
          >
            <Plus size={14} /> Thêm Nghệ Sĩ
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-4 bg-[#F5F5F0] p-6 border border-black/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono text-black/40">Tên Nghệ Sĩ</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white border border-black/10 p-2 text-sm focus:outline-none focus:border-black"
                placeholder="Ví dụ: Sơn Tùng M-TP"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono text-black/40">Thể Loại</label>
              <input 
                type="text" 
                required
                value={formData.genre}
                onChange={e => setFormData({...formData, genre: e.target.value})}
                className="w-full bg-white border border-black/10 p-2 text-sm focus:outline-none focus:border-black"
                placeholder="Ví dụ: V-Pop"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[9px] uppercase font-mono text-black/40">URL Ảnh (hoặc đường dẫn local)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required
                  value={formData.photoUrl}
                  onChange={e => setFormData({...formData, photoUrl: e.target.value})}
                  className="flex-1 bg-white border border-black/10 p-2 text-sm focus:outline-none focus:border-black"
                  placeholder="/images/artists/name.jpg"
                />
                <div className="w-10 h-10 border border-black/10 bg-white flex items-center justify-center overflow-hidden">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={16} className="text-black/20" />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest border border-black/10 hover:bg-black/5"
            >
              <X size={14} /> Hủy
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 bg-black text-white px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-black/80"
            >
              <Check size={14} /> {editingId ? 'Cập Nhật' : 'Xác Nhận'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-4 text-[9px] uppercase font-mono text-black/40">Ảnh</th>
              <th className="py-4 text-[9px] uppercase font-mono text-black/40">Nghệ Sĩ</th>
              <th className="py-4 text-[9px] uppercase font-mono text-black/40">Thể Loại</th>
              <th className="py-4 text-[9px] uppercase font-mono text-black/40 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {artists.map(artist => (
              <tr key={artist.id} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                <td className="py-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10">
                    <img src={artist.photoUrl} alt={artist.name} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="py-4">
                  <div className="font-serif italic">{artist.name}</div>
                  <div className="text-[9px] font-mono text-black/40 uppercase">{artist.voteCount} Phiếu</div>
                </td>
                <td className="py-4 text-xs font-mono uppercase text-black/60">{artist.genre}</td>
                <td className="py-4">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => startEdit(artist)}
                      className="p-2 hover:bg-black hover:text-white transition-colors border border-black/5"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(artist.id)}
                      className="p-2 hover:bg-red-500 hover:text-white transition-colors border border-black/5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
