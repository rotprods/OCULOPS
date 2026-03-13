# OCULOPS Memory Buckets

Esta carpeta define los buckets de memoria operativa fuera de DB para snapshots, playbooks y artefactos de mejora.

- `product/`: arquitectura, módulos, mapas del sistema.
- `customers/`: contexto por cliente/campaña/segmento.
- `operations/`: historial de runs, fallos, retries e incidentes.
- `improvements/`: prompts ganadores, parches y lecciones.

Nota:
- El storage canónico online sigue en `public.memory_entries`.
- Esta capa filesystem se usa para repositorio de conocimiento versionado.
