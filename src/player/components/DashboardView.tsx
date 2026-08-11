import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { HeaderNav } from './HeaderNav';
import { MobileNav } from './MobileNav';

export const DashboardView: React.FC = () => {
  const { setCurrentView, loadCourse, searchQuery } = usePlayerStore();

  const handleSelectCourse = (gcId: string) => {
    loadCourse(gcId);
    setCurrentView('trail');
  };

  const courses = [
    {
      id: 'gc_logica_01',
      title: 'Fundamentos de Lógica',
      description: 'Aprenda os blocos de construção fundamentais da programação e do pensamento computacional estruturado.',
      progress: 45,
      status: 'EM_ANDAMENTO',
      statusText: 'Em Andamento',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      actionText: 'Continuar',
      isPrimary: true,
      locked: false,
    },
    {
      id: 'gc_arq_02',
      title: 'Arquitetura de Sistemas',
      description: 'Design e estruturação de aplicações escaláveis para ambientes corporativos modernos.',
      progress: 0,
      status: 'NAO_INICIADO',
      statusText: 'Novo Módulo',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      actionText: 'Iniciar',
      isPrimary: false,
      locked: false,
    },
    {
      id: 'gc_ux_03',
      title: 'UX Design',
      description: 'Princípios avançados de usabilidade e design centrado no usuário.',
      progress: 0,
      status: 'BLOQUEADO',
      statusText: 'Requer Módulo Anterior',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
      actionText: 'Bloqueado',
      isPrimary: false,
      locked: true,
    },
  ];

  const filteredCourses = searchQuery
    ? courses.filter(
        c =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  return (
    <div className="bg-[#eff4ff] text-[#0b1c30] font-['Inter'] h-full overflow-y-auto pb-24 md:pb-12">
      <HeaderNav />

      {/* Main Content Area */}
      <main className="pt-24 px-4 md:px-6 max-w-[1280px] mx-auto">
        {/* Banner Greeting */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="font-['Hanken_Grotesk'] text-3xl md:text-4xl font-bold text-[#0b1c30] mb-2 tracking-tight">
              Bem-vindo de volta!
            </h1>
            <p className="text-base text-[#404753]">Aqui está sua trilha de aprendizado atual.</p>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`bg-white border rounded-md shadow-xs flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md ${
                course.isPrimary
                  ? 'border-[#005daa] border-l-4'
                  : 'border-[#c0c7d6]'
              } ${course.locked ? 'opacity-75 grayscale-[20%]' : ''}`}
            >
              {/* Image Container */}
              <div className="h-48 w-full relative bg-[#dce9ff]">
                <img
                  src={course.image}
                  alt={course.title}
                  className={`w-full h-full object-cover ${course.locked ? 'opacity-60' : ''}`}
                />
                {course.statusText && !course.locked && (
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full border border-[#c0c7d6] text-[#005daa] font-['JetBrains_Mono'] text-xs font-medium">
                    {course.statusText}
                  </div>
                )}
                {course.locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#213145]/20 backdrop-blur-xs">
                    <span className="material-symbols-outlined text-4xl text-white drop-shadow">
                      lock
                    </span>
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="p-4 flex-1 flex flex-col">
                <h2 className="font-['Hanken_Grotesk'] text-xl font-semibold text-[#0b1c30] mb-2">
                  {course.title}
                </h2>
                <p className="text-sm text-[#404753] mb-6 flex-1 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between font-['JetBrains_Mono'] text-xs text-[#404753] mb-2">
                    <span>{course.locked ? 'Requer Módulo Anterior' : 'Progresso'}</span>
                    {!course.locked && <span>{course.progress}%</span>}
                  </div>
                  <div className="w-full bg-[#e5eeff] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        course.locked ? 'bg-[#c0c7d6]' : 'bg-[#005daa]'
                      }`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                {course.locked ? (
                  <button
                    disabled
                    className="w-full bg-[#e5eeff] text-[#707785] font-['Hanken_Grotesk'] text-sm font-semibold py-3 rounded-md cursor-not-allowed"
                  >
                    {course.actionText}
                  </button>
                ) : course.isPrimary ? (
                  <button
                    onClick={() => handleSelectCourse(course.id)}
                    className="w-full bg-[#005daa] text-white font-['Hanken_Grotesk'] text-sm font-semibold py-3 rounded-md hover:bg-[#0075d5] transition-colors shadow-xs"
                  >
                    {course.actionText}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectCourse(course.id)}
                    className="w-full bg-transparent border border-[#005daa] text-[#005daa] font-['Hanken_Grotesk'] text-sm font-semibold py-3 rounded-md hover:bg-[#eff4ff] transition-colors"
                  >
                    {course.actionText}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <MobileNav />
    </div>
  );
};
