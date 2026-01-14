<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/NarraLeaf/.github/refs/heads/master/doc/banner-md-transparent.png">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/NarraLeaf/.github/refs/heads/master/doc/banner-md-light.png">
  <img alt="NarraLeaf Logo" src="https://raw.githubusercontent.com/NarraLeaf/.github/refs/heads/master/doc/banner-md-light.png">
</picture>

# NarraLang

A modern, expressive scripting DSL for narrative-driven experiences.

NarraLang is a scripting language designed for [NarraLeaf Engine](https://github.com/NarraLeaf/).

It provides a highly flexible scripting solution for authoring NarraLeaf stories through its clear and easy-to-understand syntax, strong logical structure, and multiple compatibility options.

---

## Key Features

- **Easy to learn** - The basic syntax is similar to JavaScript, but it retains only the essential concepts while discarding confusing features
- **Strong Logical Structure** - The built-in syntax is robust enough to serve as a programming language, enabling the construction of complex game logic
- **Tool Chain** - The VSC extension and linting toolchain currently under development will be used to help build professional and maintainable script projects

## Examples

```nls
character John "John"
image John "john.png" pos [5, 10] scale 1.0

scene Morning {
  John: "Hello, my friend."
  John: "It's a new day. Let's do our best!"

  John char "john-happy.png"

  John: "Let's start with <b>the basic syntax</b>!"
}
```

## Documentation

In progress...

## Tools

### NLC

In progress...

### NarraLint

In progress...

## Integration

In progress...

## Localization

In progress...

## License

> MIT © [NarraLeaf Project](https://github.com/NarraLeaf)

## Contributing

We're just getting started! Feel free to:

- Report issues
- Suggest new syntax sugar
- Help implement multi-language support
- Contribute tests or documentation
