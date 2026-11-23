-- Execute apenas em um banco descartável, após a inicialização do Flyway.
-- Defina @test_password_hash na mesma conexão com o bcrypt da senha efêmera.
START TRANSACTION;
INSERT INTO platform_account (id,nome,brand_name,primary_color,accent_color,created_at,trial_ends_at,professional,suspended)
VALUES
  (7101,'Empresa E2E A','Empresa E2E A','#315fe8','#35cda0',NOW(),DATE_ADD(NOW(),INTERVAL 3 DAY),FALSE,FALSE),
  (7102,'Empresa E2E B','Empresa E2E B','#315fe8','#35cda0',NOW(),DATE_ADD(NOW(),INTERVAL 3 DAY),FALSE,FALSE);
INSERT INTO usuario (id,nome,email,senha,tipo,ativo,conta_id)
VALUES
  (7101,'Titular A','titular-a@example.test',@test_password_hash,'CLIENTE',TRUE,7101),
  (7102,'Titular B','titular-b@example.test',@test_password_hash,'CLIENTE',TRUE,7102),
  (7103,'Equipe A','equipe-a@example.test',@test_password_hash,'USUARIO',TRUE,7101),
  (7104,'Operador A','operador-a@example.test',@test_password_hash,'FUNCIONARIO',TRUE,7101),
  (7105,'Admin de E2E','admin-e2e@example.test',@test_password_hash,'ADMINISTRADOR',TRUE,NULL),
  (7106,'Beneficiário A','beneficiario-a@example.test',@test_password_hash,'CLIENTE',TRUE,NULL);

INSERT INTO tipo_consorcio (id,nome) VALUES (7101,'Consórcio E2E');
INSERT INTO consorcio (id,nome,tipo_id,ativo) VALUES (7101,'Consórcio E2E',7101,TRUE);
INSERT INTO grupo (id,numero,consorcio_id) VALUES (7101,'Grupo E2E',7101);
INSERT INTO cota (id,numero,grupo_id,valor_credito,ativa) VALUES (7101,'Cota E2E',7101,10000,TRUE);
INSERT INTO assembleia (id,grupo_id,data) VALUES (7101,7101,CURRENT_DATE);

CREATE TEMPORARY TABLE e2e_processos (id BIGINT PRIMARY KEY, fase VARCHAR(50), cliente BIGINT, referencia VARCHAR(255));
INSERT INTO e2e_processos
WITH RECURSIVE ids AS (SELECT 7201 AS id UNION ALL SELECT id + 1 FROM ids WHERE id < 7221)
SELECT id,'EM_PROCESSO_DE_BAIXA',7101,CONCAT('LOTE07-BAIXA-',id) FROM ids;
INSERT INTO e2e_processos VALUES
 (7301,'EM_ANALISE',7101,'LOTE07-ANDAMENTO'),
 (7302,'FINALIZADO',7101,'LOTE07-SEM-COMPROVANTE'),
 (7303,'EM_PROCESSO_DE_BAIXA',7102,'LOTE07-OUTRA-EMPRESA'),
 (7304,'AGUARDANDO_COMUNICACAO',7101,'LOTE07-COMUNICACAO'),
 (7305,'AGUARDANDO_COMUNICACAO',7106,'LOTE07-PORTAL');

INSERT INTO contemplacao (id,cota_id,assembleia_id,data,tipo,valor)
SELECT id,7101,7101,CURRENT_DATE,'SORTEIO',10000 FROM e2e_processos ORDER BY id;
INSERT INTO processo_contemplacao (id,contemplacao_id,status,cliente_id,id_externo,origem,criado_em,atualizado_em)
SELECT id,id,fase,cliente,referencia,'LOTE07',NOW(),NOW() FROM e2e_processos ORDER BY id;

INSERT INTO comunicacao (processo_id,canal,status,responsavel_id,destinatario,assunto,mensagem,criada_em,comunicado_oficial)
VALUES
 (7304,'EMAIL','PENDENTE',7105,'destino@example.test','E2E','Mensagem fictícia',NOW(),TRUE),
 (7304,'WHATSAPP','PENDENTE',7105,'000000000000','E2E','Mensagem fictícia',NOW(),TRUE);
DROP TEMPORARY TABLE e2e_processos;
COMMIT;
