
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole } from '../types';

interface UserManagementViewProps {
  users: User[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User | null;
}

const UserRow = React.memo(({ 
  user, 
  onEditUser, 
  onDeleteUser, 
  isAdmin, 
  isSelf 
}: { 
  user: User; 
  onEditUser: (user: User) => void; 
  onDeleteUser: (id: string) => void; 
  isAdmin: boolean;
  isSelf: boolean;
}) => (
  <tr className="hover:bg-slate-50/50 transition-colors group">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
          user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
        }`}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
        user.role === UserRole.ADMIN ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
        user.role === UserRole.GESTOR ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
        'bg-slate-50 border-slate-100 text-slate-600'
      }`}>
        {user.role}
      </span>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Ativo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        <span className="text-xs font-medium text-slate-600">{user.status}</span>
      </div>
    </td>
    <td className="px-6 py-4">
      <span className="text-xs text-slate-500">{user.lastLogin}</span>
    </td>
    <td className="px-6 py-4">
      <div className="flex justify-center gap-2">
        <button 
          onClick={() => onEditUser(user)}
          disabled={!isAdmin}
          className={`p-2 rounded-lg transition-all ${isAdmin ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50' : 'text-slate-200 cursor-not-allowed'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button 
          onClick={() => onDeleteUser(user.id)}
          disabled={!isAdmin || isSelf}
          title={isSelf ? "Você não pode excluir sua própria conta" : "Excluir Usuário"}
          className={`p-2 rounded-lg transition-all ${isAdmin && !isSelf ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-200 cursor-not-allowed'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </td>
  </tr>
));

const UserManagementView: React.FC<UserManagementViewProps> = ({ users, onAddUser, onEditUser, onDeleteUser, currentUser }) => {
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return users.slice(start, start + itemsPerPage);
  }, [users, currentPage]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h2>
          <p className="text-slate-500 text-sm mt-1">Controle de acessos e permissões do sistema governamental.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={onAddUser}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Novo Usuário
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nível de Acesso</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Último Acesso</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((user) => (
                <UserRow 
                  key={user.id} 
                  user={user} 
                  onEditUser={onEditUser} 
                  onDeleteUser={onDeleteUser} 
                  isAdmin={isAdmin}
                  isSelf={user.id === currentUser?.id}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">
              Página <span className="text-indigo-600 font-bold">{currentPage}</span> de <span className="text-slate-900 font-bold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 transition-all"
              >
                Anterior
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 transition-all"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementView;
