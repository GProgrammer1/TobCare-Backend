import Handlebars from "handlebars"
import { readFileSync } from "node:fs"
import { join, extname } from "node:path"
import { inject, singleton } from "tsyringe"

export interface TemplateRendererConfig {
  templatesBase: string
}

@singleton()
export class TemplateRendererService {
  private readonly templatesBase: string

  constructor(@inject("TemplateRendererConfig") config: TemplateRendererConfig) {
    this.templatesBase = config.templatesBase
  }

  private resolvePath(filePath: string, ext: string): string {
    const withExt = extname(filePath) === ext ? filePath : `${filePath}${ext}`
    return join(this.templatesBase, withExt)
  }

  private loadStyles(stylePath: string): string {
    const raw = readFileSync(this.resolvePath(stylePath, ".css"), "utf-8")
    return raw
      .replace(/@import[^;]+;/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  loadTemplate(templatePath: string, stylePath?: string): Handlebars.TemplateDelegate {
    const source = readFileSync(this.resolvePath(templatePath, ".hbs"), "utf-8")
    const template = Handlebars.compile(source)

    if (!stylePath) return template

    const styles = this.loadStyles(stylePath)
    return (context: Record<string, unknown>) => template({ ...context, styles })
  }

  render(template: Handlebars.TemplateDelegate, context: Record<string, unknown>): string {
    return template(context)
  }
}