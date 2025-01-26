import { Form, InformedProps, Input, SchemaFields, useField } from "informed";
import { FromSchema } from "json-schema-to-ts";
import React, { useEffect } from "react";
import { SortierWorkerInputData } from "../../hooks/use-sortier";
import { fileTypes } from "../../utilities/default-text";
import "./styles.css";

export type OptionsEditorProps = {
  className?: string;
  fileType: SortierWorkerInputData["type"];
  options: SortierWorkerInputData["options"];
  onFileTypeChange: (fileType: SortierWorkerInputData["type"]) => void;
  onOptionsChange: (options: SortierWorkerInputData["options"]) => void;
};

// TODO: Need to use informed + schema to create the form to edit options
const schema = {
  properties: {
    file: {
      properties: {
        type: {
          oneOf: fileTypes.map((fileType) => ({
            const: fileType,
            title: fileType,
          })),
          title: "Type",
          type: "string",
          "ui:props": {
            defaultValue: fileTypes[0],
          },
        },
      },
      title: "File",
      type: "object",
    },
    js: {
      properties: {
        sortImportDeclarations: {
          oneOf: ["first-specifier", "source"].map((value) => ({
            const: value,
            title: value,
          })),
          title: "sortImportDeclarations",
          type: "string",
          "ui:props": {
            defaultValue: "source",
          },
        },
        // sortImportDeclarationSpecifiers: {
        //   title: "sortImportDeclarationSpecifiers",
        //   type: "object",
        //   properties: {
        //     groups: {
        //       title: "groups",
        //       type: "array",
        //       "ui:control": "array",
        //       "ui:props": {
        //         defaultValue: [{ group: "*" }, { group: "interfaces" }, { group: "types" }],
        //       },
        //       items: {
        //         type: "object",
        //         required: ["group"],
        //         properties: {
        //           group: {
        //             type: "string",
        //           },
        //         },
        //       },
        //     },
        //   },
        // },
      },
      title: "js",
      type: "object",
    },
    // css: {
    //   title: "css",
    //   type: "object",
    //   properties: {
    // sortDeclarations: {
    //   title: "sortDeclarations",
    //   type: "object",
    //   required: ["overrides"],
    //   properties: {
    //     overrides: {
    //       title: "overrides",
    //       type: "object",
    //       properties: {
    //         groups: {
    //           title: "groups",
    //           type: "array",
    //           "ui:control": "array",
    //           "ui:props": {
    //             defaultValue: [
    //               {
    //                 group: "top",
    //               },
    //               {
    //                 group: "right",
    //               },
    //               {
    //                 group: "bottom",
    //               },
    //               {
    //                 group: "left",
    //               },
    //               {
    //                 group: "*",
    //               },
    //             ],
    //           },
    //           items: {
    //             type: "object",
    //             required: ["group"],
    //             properties: {
    //               group: {
    //                 type: "string",
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
    //   },
    // },
  },
  required: ["file"],
  type: "object",
} as const;

const FieldSet: typeof Input = ({ type, ...props }) => {
  const field = useField({
    type: "object",
    ...props,
  });
  const { ref, render, userProps } = field as any;
  return render(
    <fieldset ref={ref}>
      <legend>{userProps.label}</legend>
      {userProps.children}
    </fieldset>,
  );
};
export function OptionsEditor(props: OptionsEditorProps) {
  const formApiRef = React.useRef<any>(null);
  const [isFormLoaded, setFormLoaded] = React.useState(false);
  const { className, fileType, onFileTypeChange, onOptionsChange, options } = props;

  //#region callbacks
  const onSubmit: InformedProps<unknown>["onChange"] = (formState) => {
    if (!isFormLoaded) {
      return;
    }
    const values = formState.values as FromSchema<typeof schema>;

    const newFileType = fileTypes.find((fileType) => fileType === values.file.type);
    if (newFileType != null && newFileType !== fileType) {
      onFileTypeChange(newFileType);
    }
    const newOptions = {
      js: values.js,
    };
    onOptionsChange(newOptions);
  };
  //#endregion

  useEffect(() => {
    formApiRef?.current?.setTheseValues({ file: { type: fileType }, js: options.js });
    setFormLoaded(true);
  }, [formApiRef?.current]);

  // TODO: URL doesn't seem to work
  console.log({ fileType });
  return (
    <section className={"site--options-editor " + className}>
      <Form
        components={{
          object: FieldSet,
        }}
        formApiRef={formApiRef}
        onChange={onSubmit}
        schema={schema}
      >
        <SchemaFields />
      </Form>
    </section>
  );
}
