'use client'

import { useState, useEffect } from 'react'

export default function AdminDashboard() {
  // Loading removido - dashboard carrega diretamente

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Admin
        </h1>
        <p className="text-gray-600">
          Visão geral do sistema e métricas principais.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            12
          </div>
          <div className="text-sm text-gray-600">
            Projetos Ativos
          </div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-600 mb-1">
            R$ 45.230
          </div>
          <div className="text-sm text-gray-600">
            Total Arrecadado
          </div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-700 mb-1">
            156
          </div>
          <div className="text-sm text-gray-600">
            Doações
          </div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-500 mb-1">
            89
          </div>
          <div className="text-sm text-gray-600">
            Usuários
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Projetos Recentes
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Educação Infantil</p>
                <p className="text-xs text-gray-500">Criado há 2 dias</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Ativo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Alimentação</p>
                <p className="text-xs text-gray-500">Criado há 5 dias</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Ativo
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Doações Recentes
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">R$ 150,00</p>
                <p className="text-xs text-gray-500">João Silva - Educação</p>
              </div>
              <span className="text-xs text-gray-500">Hoje</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">R$ 75,00</p>
                <p className="text-xs text-gray-500">Maria Santos - Alimentação</p>
              </div>
              <span className="text-xs text-gray-500">Ontem</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
