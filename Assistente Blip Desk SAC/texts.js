const ModelosProtocolo = {

  descricoesPorMotivo: {
    "CLIENTE": {
      abertura: "Cliente entrou em contato",
      fechamento: ``
    },
    "INTERNET LENTA": {
      abertura: "Cliente entrou em contato informando estar com a conexão lenta",
      fechamento: `Modelo Roteador: 
Firmware:
Aparelhos conectados: 
Sinal de fibra: 
Consta histórico de desconexões: Não

Após os procedimentos realizados o cliente confirmou a normalização.`
    },
    "SEM INTERNET": {
      abertura: "Cliente entrou em contato informando sem internet",
      fechamento: `ROTEADOR/ ONT: 
ONU: 
Configurado: 
Sinal de Fibra: 
Com Histórico de Desconexão: Sim
Status de leds: PON: Apagada; LOS: Ligada

1. PON Apagada. Falta de sinal na ONU
2. Visita para correção de sinal de fibra
3. Roteador ou fonte que não ligou`
    },
    "TROCA DE SENHA": {
      abertura: "O titular entrou em contato solicitando sua alteração de senha.",
      fechamento: `Nova Senha:
Novo SSID:
Roteador: 

Troca de senha realizada conforme solicitação.
Realizado confirmação de titularidade via dados: Data de Nascimento.
Cliente ciente das informações, também confirma acesso à rede com a nova senha.
Protocolo de atendimento finalizado.`
    },
    "MANUTENÇÃO EMERGENCIAL": {
      abertura: "Cliente entrou em contato informando dificuldade de acesso em sua conexão.",
      fechamento: `Verificado que na localidade do cliente ocorria manutenção corretiva.
Prazo de normalização do serviço de 4 horas a depender do caso.
Protocolo Concluído.`
    },
    "INSTABILIDADE": {
      abertura: "Cliente entrou em contato informando dificuldades na navegação.",
      fechamento: `Cliente foi informado sobre a instabilidade que ocorria no momento.
Prazo de normalização do serviço de 4 horas a depender do caso.
Ciente de que deverá manter os equipamentos ligados à tomada, para identificar quando sua conexão for normalizada.`
    },
    "SEGUNDA VIA DO BOLETO": {
      abertura: "Cliente entrou em contato solicitando a 2ª via do boleto.",
      fechamento: `Encaminhado ao e-mail: 
Ciente que após pagamento deve aguardar a compensação bancária. Sendo Via Pix de até 2h, via boleto 48 horas úteis para efetivação do pagamento em sistema e liberar sua conexão.
Ciente de que poderá realizar o desbloqueio por confiança pelo app ou Whatsapp no menu principal.
Atendimento Concluído.`
    },
    "INFORMAR PAGAMENTO": {
      abertura: "Cliente entrou em contato informando ter realizado o pagamento.",
      fechamento: `Ciente que após pagamento deve aguardar a compensação bancária. Sendo Via pix de até 2h, via boleto 48 horas úteis para efetivação do pagamento em sistema e liberar sua conexão.
Ciente de que poderá realizar o desbloqueio por confiança pelo Aplicativo da empresa, site da empresa ou Whatsapp no menu principal.
Atendimento Concluído.`
    },
    "ALTERAÇÃO DE VENCIMENTO": {
      abertura: `Cliente solicita alterar a data de vencimento. Ciente de que não poderá realizar a troca com boleto vencido. Ciente de que a troca poderá ser gerado valor proporcional.
Disponibilidade de receber contato:
Contatos atuais:
Cliente escolheu a data:
Encaminhado ao setor responsável para dar continuidade ao seu atendimento.`,
      fechamento: ``
    },
    "CONTAS A RECEBER": {
      abertura: `Cliente entrou em contato solicitando renegociação dos seus débitos.
Disponibilidade de receber contato:
Contatos atuais:`,
      fechamento: `STATUS DO CONTRATO:
Encaminhado ao setor responsável para dar continuidade ao atendimento.`
    },
    "MUDANÇA DE TITULARIDADE": {
      abertura: `Cliente solicita Alteração de Titularidade.
Titular atual:
N° de Contrato a ser cedido:
Equipamento muda de endereço: Sim( ) Não( )
Novo titular:
Contato 1.: Contato 2.:
Endereço:
Email:
Disponibilidade de receber contato:
Contatos atuais:`,
      fechamento: ``
    },
    "TROCA DE ENDEREÇO": {
      abertura: `Cliente entrou em contato solicitando troca de endereço
Novo endereço:
Disponibilidade de receber contato:
Contatos atuais:`,
      fechamento: ``
    },
    "APLICATIVO DA CENTRAL": {
      abertura: `Solicitante:
Telefone:
Protocolo:

Cliente entrou em contato solicitando senha de acesso ao aplicativo.`,
      fechamento: `Realizada a confirmação de titularidade: RG, CPF, data de nascimento e endereço.
Cadastrada a senha no sistema e informado ao cliente.
Após cadastrar senha e passar as orientações, o cliente confirmou o acesso ao aplicativo.
Protocolo de atendimento concluído.`
    },
    "ATENUAÇÃO DE FIBRA": {
      abertura: "Cliente entrou em contato informando problemas de conexão.",
      fechamento: `Roteador/ ONT: 
ONU:
Sinal de fibra:  
Com desconexões no extrato de conexão: Sim/Não

Visita para verificação de conector e drop com possível atenuação.`
    },
    "CANCELAMENTO": {
      abertura: `Cliente entrou em contato solicitando cancelamento do seu plano.
Disponibilidade de receber contato:
Contatos atuais:
MOTIVO DO CANCELAMENTO:
Informado ao cliente sobre o prazo de 48h para o setor responsável estar dando continuidade no atendimento.`,
      fechamento: ``
    }
  },

  gerarAbertura: function(nome, telefone, ticket, motivo) {
    const m = this.descricoesPorMotivo[motivo];
    const texto = m ? m.abertura : "Atendimento registrado.";
    return `${nome}
${telefone}
${ticket}

${texto}`;
  },

  gerarFechamento: function(motivo) {
    const m = this.descricoesPorMotivo[motivo];
    return m ? m.fechamento : "";
  }
};
